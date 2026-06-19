import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpInput,
  type GoogleSerpItem,
} from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import { fetchSitemapUrls, isSitemapUrl } from "../../helpers/sitemap.js"

const PAGE_LIMIT = 100

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

function parseDirectUrls(input: string): string[] {
  return input
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("http"))
}

async function fetchIndexedPages(domain: string): Promise<Map<string, string>> {
  const query = `site:${domain}`
  log.info("fetching indexed pages", { query })

  let items: GoogleSerpItem[]
  try {
    items = await runApifyActor<GoogleSerpItem[]>(
      SCRAPERLINK_GOOGLE_SERP,
      {
        keyword: query,
        limit: "100",
        country: "US",
        include_merged: false,
      } satisfies GoogleSerpInput,
      90
    )
  } catch (err) {
    log.error("apify call failed", { domain, err: String(err) })
    throw new Error("Failed to query Google index. Please try again.")
  }

  const results = items.flatMap((item) => item.results ?? [])
  log.info("indexed pages from serp", { domain, resultCount: results.length })

  // normalized URL → title
  const indexed = new Map<string, string>()
  for (const r of results) {
    if (r.url) indexed.set(normalizeUrl(r.url), r.title ?? urlToTitle(r.url))
  }
  return indexed
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

  const domain = toSiteQuery(cappedUrls[0]!).split("/")[0]!
  const indexedMap = await fetchIndexedPages(domain)

  const pages: IndexedPage[] = cappedUrls.map((url, i) => {
    const normalized = normalizeUrl(url)
    const title = indexedMap.get(normalized) ?? urlToTitle(url)
    const indexed = indexedMap.has(normalized)
    return { id: String(i + 1), url, title, indexed, keywords: [] as never[] }
  })

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
