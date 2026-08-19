import { fetchWithRetry } from "../../helpers/http.js"
import { isSitemapUrl } from "../../helpers/sitemap.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("discover-sitemap")

const PROBE_PATHS = ["/sitemap.xml", "/sitemap_index.xml", "/sitemap-index.xml", "/wp-sitemap.xml"]

function parseRobotsSitemaps(body: string): string[] {
  const sitemaps: string[] = []
  for (const line of body.split(/\r?\n/)) {
    const match = /^sitemap:\s*(\S+)/i.exec(line.trim())
    if (match?.[1]) sitemaps.push(match[1])
  }
  return sitemaps
}

/**
 * Find candidate sitemap URLs for a site: robots.txt `Sitemap:` directives
 * first, then a fixed probe list. Returns [] rather than throwing so callers
 * can fall back to crawling just the homepage.
 */
export async function discoverSitemapUrls(websiteUrl: string): Promise<string[]> {
  let origin: string
  try {
    origin = new URL(websiteUrl).origin
  } catch {
    return []
  }

  try {
    const robots = await fetchWithRetry(`${origin}/robots.txt`, { timeoutMs: 8_000, maxAttempts: 1 })
    const fromRobots = parseRobotsSitemaps(robots.body).filter(isSitemapUrl)
    if (fromRobots.length > 0) {
      log.info("sitemap found via robots.txt", { origin, count: fromRobots.length })
      return Array.from(new Set(fromRobots)).slice(0, 5)
    }
  } catch (err) {
    log.info("robots.txt fetch failed, falling back to probing", { origin, error: String(err) })
  }

  for (const path of PROBE_PATHS) {
    const candidate = `${origin}${path}`
    try {
      const res = await fetchWithRetry(candidate, { timeoutMs: 8_000, maxAttempts: 1 })
      if (res.status >= 200 && res.status < 300) {
        log.info("sitemap found via probe", { candidate })
        return [candidate]
      }
    } catch {
      continue
    }
  }

  log.info("no sitemap found", { origin })
  return []
}
