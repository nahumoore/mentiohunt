import { createLogger } from "./logger.js"
import { scraperLightLimit } from "./scraper-limits.js"

const log = createLogger("scraper-content-client")

export type ScrapedPageContent = {
  title: string
  description: string
  text: string
}

/**
 * Single scraper round-trip via the tiered light->dynamic->stealthy escalation
 * in apps/scraper (POST /fetch-content) — the same pipeline that already
 * handles Cloudflare/WAF-protected sites for backlink discovery and link
 * tracking. Returns null on any transport or scraper-side failure; callers
 * decide how to surface that.
 */
export async function fetchPageContent(url: string): Promise<ScrapedPageContent | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping fetch-content")
    return null
  }

  return scraperLightLimit(async () => {
    try {
      const scraperApiKey = process.env.SCRAPER_API_KEY
      const res = await fetch(`${scraperUrl}/fetch-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!res.ok) {
        log.warn("scraper fetch-content failed", { url, status: res.status })
        return null
      }
      return (await res.json()) as ScrapedPageContent
    } catch (err) {
      log.warn("scraper fetch-content error", { url, error: String(err) })
      return null
    }
  })
}
