import { XMLParser } from "fast-xml-parser"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpInput,
  type GoogleSerpItem,
} from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { fetchWithRetry } from "../../helpers/http.js"
import { createLogger } from "../../helpers/logger.js"

const PAGE_LIMIT = 20
const BATCH_SIZE = 5

const log = createLogger("google-index-checker")

export type IndexedPage = {
  id: string
  url: string
  title: string
  indexed: boolean
  keywords: never[]
}

export type IndexCheckResult = {
  pages: IndexedPage[]
  summary: {
    total: number
    indexed: number
    notIndexed: number
    totalKeywords: number
    highOpportunities: number
  }
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url)
    return (u.hostname.replace(/^www\./, "") + u.pathname)
      .toLowerCase()
      .replace(/\/+$/, "")
  } catch {
    return url.toLowerCase().replace(/\/+$/, "")
  }
}

// Strip protocol — site: operator doesn't accept https://
function toSiteQuery(url: string): string {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "")
}

function urlToTitle(url: string): string {
  try {
    const u = new URL(url)
    if (u.pathname === "/" || u.pathname === "") return u.hostname.replace(/^www\./, "")
    const slug = u.pathname.split("/").filter(Boolean).pop() ?? u.hostname
    return slug
      .replace(/[-_]/g, " ")
      .replace(/\.\w+$/, "")
      .replace(/\b\w/g, (c) => c.toUpperCase())
  } catch {
    return url
  }
}

async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
  if (depth > 1) return []

  log.info("fetching sitemap", { url: sitemapUrl, depth })

  let body: string
  try {
    const res = await fetchWithRetry(sitemapUrl, { timeoutMs: 15_000, maxAttempts: 2 })
    body = res.body
  } catch (err) {
    log.error("sitemap fetch failed", { url: sitemapUrl, err: String(err) })
    throw new Error("Could not fetch sitemap. Check the URL and try again.")
  }

  const parser = new XMLParser({ ignoreAttributes: false })
  let parsed: unknown
  try {
    parsed = parser.parse(body)
  } catch {
    throw new Error("Could not parse sitemap XML.")
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "sitemapindex" in parsed &&
    (parsed as Record<string, unknown>).sitemapindex !== null
  ) {
    const idx = (parsed as Record<string, unknown>).sitemapindex as Record<string, unknown>
    const sitemaps = Array.isArray(idx.sitemap) ? idx.sitemap : idx.sitemap ? [idx.sitemap] : []
    log.info("sitemap index found", { childCount: sitemaps.length })
    const first = sitemaps[0]
    const loc = first
      ? typeof first === "string"
        ? first
        : (first as Record<string, unknown>).loc
      : null
    if (loc && typeof loc === "string") return fetchSitemapUrls(loc, depth + 1)
    return []
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "urlset" in parsed &&
    (parsed as Record<string, unknown>).urlset !== null
  ) {
    const urlset = (parsed as Record<string, unknown>).urlset as Record<string, unknown>
    const urls = Array.isArray(urlset.url) ? urlset.url : urlset.url ? [urlset.url] : []
    const result = urls
      .map((u: unknown) => {
        if (typeof u === "string") return u
        if (u && typeof u === "object" && "loc" in u) {
          const loc = (u as Record<string, unknown>).loc
          return typeof loc === "string" ? loc : String(loc)
        }
        return null
      })
      .filter((u): u is string => u !== null && u.startsWith("http"))
    log.info("sitemap parsed", { urlCount: result.length })
    return result
  }

  throw new Error("No URLs found in sitemap. Make sure it's a valid sitemap.xml file.")
}

function parseDirectUrls(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http"))
}

function isSitemapUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.endsWith(".xml") || pathname.includes("sitemap")
  } catch {
    return url.toLowerCase().includes(".xml") || url.toLowerCase().includes("sitemap")
  }
}

async function checkSingleUrl(url: string): Promise<{ indexed: boolean; title: string }> {
  const query = `site:${toSiteQuery(url)}`
  log.info("checking url", { url, query })

  let items: GoogleSerpItem[]
  try {
    items = await runApifyActor<GoogleSerpItem[]>(
      SCRAPERLINK_GOOGLE_SERP,
      {
        keyword: query,
        limit: "10",
        country: "US",
        include_merged: false,
      } satisfies GoogleSerpInput,
      60
    )
  } catch (err) {
    log.error("apify call failed", { url, err: String(err) })
    return { indexed: false, title: urlToTitle(url) }
  }

  const results = items.flatMap((item) => item.results ?? [])
  const normalizedInput = normalizeUrl(url)

  log.debug("serp results", {
    url,
    resultCount: results.length,
    normalizedInput,
    firstResult: results[0]?.url,
  })

  const match = results.find((r) => r.url && normalizeUrl(r.url) === normalizedInput)

  // Any results for a site:exact-url query means Google has it indexed
  const indexed = results.length > 0

  log.info("url check done", { url, indexed, matched: !!match, resultCount: results.length })

  return {
    indexed,
    title: match?.title ?? results[0]?.title ?? urlToTitle(url),
  }
}

export async function checkGoogleIndex(input: string): Promise<IndexCheckResult> {
  const trimmed = input.trim()

  let urls: string[]

  if (trimmed.includes("\n")) {
    urls = parseDirectUrls(trimmed)
    log.info("using direct url list", { count: urls.length })
    if (urls.length === 0) {
      throw new Error("No valid URLs found. Each line must start with http:// or https://.")
    }
  } else if (isSitemapUrl(trimmed)) {
    urls = await fetchSitemapUrls(trimmed)
    log.info("sitemap urls collected", { count: urls.length })
    if (urls.length === 0) {
      throw new Error("No URLs found in sitemap.")
    }
  } else {
    if (!trimmed.startsWith("http")) {
      throw new Error("Enter a valid URL starting with http:// or https://.")
    }
    urls = [trimmed]
    log.info("single url mode")
  }

  const cappedUrls = urls.slice(0, PAGE_LIMIT)
  log.info("checking pages", { total: urls.length, capped: cappedUrls.length })

  const pages: IndexedPage[] = []

  for (let i = 0; i < cappedUrls.length; i += BATCH_SIZE) {
    const batch = cappedUrls.slice(i, i + BATCH_SIZE)
    log.info("processing batch", { batchStart: i, batchSize: batch.length })
    const batchResults = await Promise.all(
      batch.map(async (url, batchIndex) => {
        const { indexed, title } = await checkSingleUrl(url)
        return {
          id: String(i + batchIndex + 1),
          url,
          title,
          indexed,
          keywords: [] as never[],
        }
      })
    )
    pages.push(...batchResults)
  }

  const indexed = pages.filter((p) => p.indexed).length
  const notIndexed = pages.length - indexed

  log.info("check complete", { total: pages.length, indexed, notIndexed })

  return {
    pages,
    summary: {
      total: pages.length,
      indexed,
      notIndexed,
      totalKeywords: 0,
      highOpportunities: 0,
    },
  }
}
