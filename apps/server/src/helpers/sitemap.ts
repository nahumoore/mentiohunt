import { XMLParser } from "fast-xml-parser"
import { fetchWithRetry } from "./http.js"
import { createLogger } from "./logger.js"

const log = createLogger("sitemap")

/** Fetch all `<loc>` URLs from a sitemap or sitemap index (1 level deep). */
export async function fetchSitemapUrls(sitemapUrl: string, depth = 0): Promise<string[]> {
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

/** Returns true if the URL looks like a sitemap (XML). */
export function isSitemapUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    return pathname.endsWith(".xml") || pathname.includes("sitemap")
  } catch {
    return url.toLowerCase().includes(".xml") || url.toLowerCase().includes("sitemap")
  }
}

const NOISE_PATH_RE =
  /\/(tags?|categor(?:y|ies)|authors?|archive|archives|feed|rss|page\/\d+|wp-(?:content|admin|includes))\b/i

const NOISE_QUERY_RE = /[?&]paged=\d+/i

const NOISE_EXTENSIONS_RE = /\.(jpg|jpeg|png|gif|webp|svg|ico|pdf|xml|css|js|woff2?|ttf|eot)(\?.*)?$/i

/**
 * Deduplicate URLs and drop low-value noise pages (tag archives, pagination,
 * author pages, feeds, non-HTML assets). Returns content URLs in original order.
 */
export function filterContentUrls(urls: string[]): string[] {
  const seen = new Set<string>()
  const result: string[] = []

  for (const url of urls) {
    if (seen.has(url)) continue
    seen.add(url)

    let pathname: string
    let search: string
    try {
      const u = new URL(url)
      pathname = u.pathname
      search = u.search
    } catch {
      continue
    }

    if (NOISE_PATH_RE.test(pathname)) continue
    if (NOISE_QUERY_RE.test(search)) continue
    if (NOISE_EXTENSIONS_RE.test(pathname)) continue

    result.push(url)
  }

  return result
}
