import { createLogger } from "../../../helpers/logger.js"
import { scraperLightLimit } from "../../../helpers/scraper-limits.js"

const log = createLogger("check-listicle-client")

export type FetchedContent = {
  url: string
  title: string
  description: string
  text: string
}

/**
 * Fetches a candidate roundup page's body via the scraper service so the
 * relevance scorer can judge, from actual content, whether it is a genuine
 * "best X tools" listicle and whether the product is already listed.
 */
export async function fetchPageContent(url: string): Promise<FetchedContent | null> {
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
        log.warn("scraper returned error", { url, status: res.status })
        return null
      }
      return (await res.json()) as FetchedContent
    } catch (err) {
      log.warn("fetch-content call failed", { url, error: String(err) })
      return null
    }
  })
}
