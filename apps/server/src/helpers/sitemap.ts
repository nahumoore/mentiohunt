import pLimit from "p-limit"
import { XMLParser } from "fast-xml-parser"
import { fetchWithRetry } from "./http.js"
import { createLogger } from "./logger.js"

const log = createLogger("sitemap")

type SitemapFetchOptions = {
  /** Max child sitemaps to expand when the root is a sitemap index. */
  maxChildSitemaps?: number
  /** Hard cap on total URLs returned across all children. */
  maxUrls?: number
  /** Internal recursion guard — do not set from callers. */
  depth?: number
}

const DEFAULT_MAX_CHILD_SITEMAPS = 10
const DEFAULT_MAX_URLS = 5000

function extractLoc(entry: unknown): string | null {
  if (typeof entry === "string") return entry
  if (entry && typeof entry === "object" && "loc" in entry) {
    const loc = (entry as Record<string, unknown>).loc
    return typeof loc === "string" ? loc : null
  }
  return null
}

async function fetchSingleSitemap(sitemapUrl: string): Promise<unknown> {
  const res = await fetchWithRetry(sitemapUrl, { timeoutMs: 15_000, maxAttempts: 2 })
  const parser = new XMLParser({ ignoreAttributes: false })
  return parser.parse(res.body)
}

/**
 * Fetch all `<loc>` URLs from a sitemap or sitemap index. Sitemap indexes are
 * expanded across all child sitemaps (capped, concurrency-limited) rather
 * than only the first — a single-child expansion badly under-collects on
 * sites that split content into several sitemaps (WordPress's
 * post-sitemap.xml / page-sitemap.xml being the common case).
 */
export async function fetchSitemapUrls(
  sitemapUrl: string,
  options: SitemapFetchOptions = {}
): Promise<string[]> {
  const maxChildSitemaps = options.maxChildSitemaps ?? DEFAULT_MAX_CHILD_SITEMAPS
  const maxUrls = options.maxUrls ?? DEFAULT_MAX_URLS
  const depth = options.depth ?? 0

  if (depth > 2) return []

  log.info("fetching sitemap", { url: sitemapUrl, depth })

  let parsed: unknown
  try {
    parsed = await fetchSingleSitemap(sitemapUrl)
  } catch (err) {
    log.error("sitemap fetch failed", { url: sitemapUrl, err: String(err) })
    throw new Error("Could not fetch sitemap. Check the URL and try again.")
  }

  if (
    parsed !== null &&
    typeof parsed === "object" &&
    "sitemapindex" in parsed &&
    (parsed as Record<string, unknown>).sitemapindex !== null
  ) {
    const idx = (parsed as Record<string, unknown>).sitemapindex as Record<string, unknown>
    const sitemaps = Array.isArray(idx.sitemap) ? idx.sitemap : idx.sitemap ? [idx.sitemap] : []
    const childUrls = sitemaps.map(extractLoc).filter((u): u is string => u !== null).slice(0, maxChildSitemaps)
    log.info("sitemap index found", { childCount: sitemaps.length, expanding: childUrls.length })

    const limit = pLimit(5)
    const results = await Promise.allSettled(
      childUrls.map((child) => limit(() => fetchSitemapUrls(child, { maxUrls, depth: depth + 1 })))
    )

    const seen = new Set<string>()
    const combined: string[] = []
    for (const result of results) {
      if (result.status !== "fulfilled") continue
      for (const url of result.value) {
        if (seen.has(url)) continue
        seen.add(url)
        combined.push(url)
        if (combined.length >= maxUrls) return combined
      }
    }
    return combined
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
      .map(extractLoc)
      .filter((u): u is string => u !== null && u.startsWith("http"))
      .slice(0, maxUrls)
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
