import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { AHREFS_SEO_TOOLS, type AhrefsBacklinkItem, type AhrefsBacklinksResponse } from "../../helpers/actors/ahrefs-seo-tools.js"
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

export type ExtractBacklinksResult = {
  items: AhrefsBacklinkItem[]
  nextCursor: string | null
}

export async function extractBacklinks(
  competitorDomain: string,
  filters: { dr_min: number; dr_max: number | null; mozCursor: string | null }
): Promise<ExtractBacklinksResult> {
  log.info("fetching backlinks", { competitorDomain })

  try {
    const response = await runApifyActor<AhrefsBacklinksResponse[]>(AHREFS_SEO_TOOLS, {
      searchType: "backlinks_list",
      urls: [`https://${competitorDomain}/`],
      mode: "subdomains",
    })

    const items = response[0]?.backlinks ?? []

    log.info("backlinks fetched", { competitorDomain, count: items.length })

    return { items, nextCursor: null }
  } catch (err) {
    log.warn("backlink fetch failed", { competitorDomain, error: String(err) })
    return { items: [], nextCursor: null }
  }
}
