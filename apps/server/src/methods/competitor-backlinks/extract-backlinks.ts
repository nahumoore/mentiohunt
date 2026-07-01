import { getBacklinks } from "../../helpers/data-for-seo/get-backlinks.js"
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

export type BacklinkItem = {
  urlFrom: string
  urlTo: string
  anchor: string
  domainRating: number
  title: string
  textPre: string
  textPost: string
}

export type ExtractBacklinksResult = {
  items: BacklinkItem[]
  nextCursor: string | null
  costUsd: number
}

export async function extractBacklinks(
  competitorDomain: string,
  filters: { dr_min: number; dr_max: number | null; mozCursor: string | null; limit?: number }
): Promise<ExtractBacklinksResult> {
  log.info("fetching backlinks", { competitorDomain })

  try {
    const { items: raw, searchAfterToken, costUsd } = await getBacklinks({
      target: competitorDomain,
      drMin: filters.dr_min,
      searchAfterToken: filters.mozCursor,
      limit: filters.limit,
    })

    const items: BacklinkItem[] = raw.map((item) => ({
      urlFrom: item.url_from ?? "",
      urlTo: item.url_to ?? "",
      anchor: item.anchor ?? "",
      domainRating: item.domain_from_rank ?? 0,
      title: item.page_from_title ?? "",
      textPre: item.text_pre ?? "",
      textPost: item.text_post ?? "",
    }))

    log.info("backlinks fetched", { competitorDomain, count: items.length, costUsd })

    return { items, nextCursor: searchAfterToken, costUsd }
  } catch (err) {
    log.warn("backlink fetch failed", { competitorDomain, error: String(err) })
    return { items: [], nextCursor: null, costUsd: 0 }
  }
}
