import { createLogger } from "../../../helpers/logger.js"
import { scraperHeavyLimit } from "../../../helpers/scraper-limits.js"
import type { AgentScrapeResponse } from "../competitor-backlink/enrich-contact.js"

const log = createLogger("check-mention-client")

export type CheckMentionResult = {
  qualified: boolean
  brand_present: boolean
  links_to_target: string[]
  reason: string
  contact: AgentScrapeResponse | null
}

/**
 * Single scraper round-trip: fetches the candidate page once, verifies the brand
 * is mentioned and not already linked, and (only when it qualifies) enriches the
 * contact from the same fetched page. Returns null on transport failure.
 */
export async function checkMention(
  url: string,
  brandTerms: string[],
  targetDomain: string
): Promise<CheckMentionResult | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping check-mention")
    return null
  }

  // Global heavy-pool slot: the abort timeout starts inside, once we hold it.
  return scraperHeavyLimit(async () => {
    try {
      const scraperApiKey = process.env.SCRAPER_API_KEY
      const res = await fetch(`${scraperUrl}/check-mention`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
        },
        body: JSON.stringify({ url, brand_terms: brandTerms, target_domain: targetDomain }),
        signal: AbortSignal.timeout(180_000),
      })
      if (!res.ok) {
        log.warn("scraper returned error", { url, status: res.status })
        return null
      }
      return (await res.json()) as CheckMentionResult
    } catch (err) {
      log.warn("check-mention call failed", { url, error: String(err) })
      return null
    }
  })
}
