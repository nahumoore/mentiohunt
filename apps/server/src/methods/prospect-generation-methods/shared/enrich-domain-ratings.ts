import pLimit from "p-limit"
import { getDomainRating } from "../../../helpers/ahrefs/get-domain-rating.js"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("enrich-domain-ratings")

/** Look up domain ratings for the given domains via Ahrefs. Best-effort. */
export async function enrichDomainRatings(domains: string[]): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>()
  if (domains.length === 0) return map
  if (!process.env.AHREFS_API_KEY) return map

  try {
    const limit = pLimit(5)
    await Promise.all(
      domains.map((domain) =>
        limit(async () => {
          const rating = await getDomainRating(domain)
          map.set(domain, rating)
        })
      )
    )
  } catch (err) {
    log.warn("DR enrichment failed", { error: String(err) })
  }
  return map
}
