import { AHREFS_SEO_TOOLS, type AhrefsBacklinkItem } from "../../actors/ahrefs-seo-tools.js"
import { runApifyActor } from "../../actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("extract-competitor-backlinks")

export function extractCompetitorDomain(competitorUrl: string): string {
  try {
    return new URL(competitorUrl).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return competitorUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

export async function extractBacklinks(competitorDomain: string): Promise<AhrefsBacklinkItem[]> {
  log.info("fetching backlinks", { competitorDomain })

  try {
    const results = await runApifyActor<AhrefsBacklinkItem[]>(
      AHREFS_SEO_TOOLS,
      { searchType: "backlinks", target: competitorDomain },
      300
    )

    const valid = (results ?? []).filter(
      (r) => r.urlFrom && r.urlTo && typeof r.domainRating === "number"
    )

    log.info("backlinks fetched", { competitorDomain, total: results?.length ?? 0, valid: valid.length })

    return valid
  } catch (err) {
    log.warn("backlink fetch failed", { competitorDomain, error: String(err) })
    return []
  }
}
