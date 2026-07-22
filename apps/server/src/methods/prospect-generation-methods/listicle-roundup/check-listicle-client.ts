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
 * Why a fetch resolved the way it did, for per-run yield instrumentation.
 * "http_error" is a server-side failure (the scraper returned non-2xx, e.g. a
 * 502 for a Cloudflare-blocked host — the scraper's own `fetch_outcome=` logs
 * break that down further); "timeout" is the client abort firing before the
 * scraper answered; "error" is any other transport failure.
 */
export type FetchOutcome = "ok" | "http_error" | "timeout" | "error" | "no_scraper_url"

/**
 * Fetches a candidate roundup page's body via the scraper service so the
 * relevance scorer can judge, from actual content, whether it is a genuine
 * "best X tools" listicle and whether the product is already listed.
 *
 * `onOutcome` (optional) reports how the fetch resolved so callers can
 * aggregate a per-run breakdown of lost candidates without correlating logs.
 */
export async function fetchPageContent(
  url: string,
  onOutcome?: (outcome: FetchOutcome) => void
): Promise<FetchedContent | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping fetch-content")
    onOutcome?.("no_scraper_url")
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
        onOutcome?.("http_error")
        return null
      }
      onOutcome?.("ok")
      return (await res.json()) as FetchedContent
    } catch (err) {
      const isTimeout = err instanceof Error && err.name === "TimeoutError"
      log.warn("fetch-content call failed", { url, error: String(err) })
      onOutcome?.(isTimeout ? "timeout" : "error")
      return null
    }
  })
}
