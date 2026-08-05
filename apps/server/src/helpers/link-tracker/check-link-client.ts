import { createLogger } from "../../helpers/logger.js"
import { scraperLightLimit } from "../../helpers/scraper-limits.js"

const log = createLogger("check-link-client")

export type LinkAnchor = {
  href: string
  rel_tokens: string[]
  anchor_text: string
  is_dofollow: boolean
  is_image_link: boolean
}

export type CompetitorLink = {
  domain: string
  href: string
  anchor_text: string
}

export type CheckLinkOutcome = "ok" | "dead" | "http_error" | "cf_blocked" | "fetch_failed"

export type CheckLinkResult = {
  outcome: CheckLinkOutcome
  status_code: number | null
  final_url: string | null
  redirected: boolean
  total_links: number
  target_links: LinkAnchor[]
  competitor_links: CompetitorLink[]
}

/**
 * Single scraper round-trip: re-fetches a tracked link's source page (via the
 * tiered light->dynamic->stealthy escalation in apps/scraper) and returns
 * every anchor pointing at our domain plus any pointing at a competitor's.
 * Returns null only on a transport-level failure (scraper unreachable,
 * timeout, non-2xx from the scraper route itself) — the caller must map that
 * to a transient "fetch_failed" outcome, never to "the link was removed".
 */
export async function checkLink(args: {
  url: string
  targetDomain: string
  competitorDomains: string[]
  forceDynamic?: boolean
}): Promise<CheckLinkResult | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping check-link")
    return null
  }

  // Global light-pool slot: the abort timeout starts inside, once we hold it.
  return scraperLightLimit(async () => {
    try {
      const scraperApiKey = process.env.SCRAPER_API_KEY
      const res = await fetch(`${scraperUrl}/check-link`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
        },
        body: JSON.stringify({
          url: args.url,
          target_domain: args.targetDomain,
          competitor_domains: args.competitorDomains,
          force_dynamic: args.forceDynamic ?? false,
        }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!res.ok) {
        log.warn("scraper returned error", { url: args.url, status: res.status })
        return null
      }
      return (await res.json()) as CheckLinkResult
    } catch (err) {
      log.warn("check-link call failed", { url: args.url, error: String(err) })
      return null
    }
  })
}
