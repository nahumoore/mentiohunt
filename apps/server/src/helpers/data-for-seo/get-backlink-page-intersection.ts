import { dataForSeoPost } from "./client.js"

type IntersectionBacklink = {
  url_from?: string | null
  url_to?: string | null
  anchor?: string | null
  domain_from_rank?: number | null
  page_from_title?: string | null
  text_pre?: string | null
  text_post?: string | null
  dofollow?: boolean | null
}

type IntersectionItem = {
  page_intersection?: Record<string, IntersectionBacklink[] | null> | null
  summary?: { intersections_count?: number | null } | null
}

type PageIntersectionResult = {
  items?: IntersectionItem[] | null
}

export type BacklinkIntersectionItem = {
  competitorDomain: string
  urlFrom: string
  urlTo: string
  anchor: string
  domainRating: number
  title: string
  textPre: string
  textPost: string
}

/**
 * Find referring pages shared by at least two competitors while excluding
 * pages that already link to the customer's domain.
 */
export async function getBacklinkPageIntersection(
  competitorDomains: string[],
  ownDomain: string,
  limit = 200
): Promise<{ items: BacklinkIntersectionItem[]; costUsd: number }> {
  const domains = [...new Set(competitorDomains)].slice(0, 5)
  if (domains.length < 2) return { items: [], costUsd: 0 }

  const targets = Object.fromEntries(domains.map((domain, index) => [String(index + 1), domain]))
  const { result, costUsd } = await dataForSeoPost<PageIntersectionResult>(
    "backlinks/page_intersection/live",
    {
      targets,
      exclude_targets: [ownDomain],
      intersection_mode: "partial",
      mode: "one_per_domain",
      rank_scale: "one_hundred",
      backlinks_status_type: "live",
      backlinks_filters: ["dofollow", "=", true],
      exclude_internal_backlinks: true,
      order_by: ["1.domain_from_rank,desc"],
      limit,
    }
  )

  const items: BacklinkIntersectionItem[] = []
  for (const row of result.items ?? []) {
    if ((row.summary?.intersections_count ?? 0) < 2) continue

    for (const [targetKey, links] of Object.entries(row.page_intersection ?? {})) {
      const link = links?.find((candidate) => candidate.dofollow !== false && candidate.url_from)
      const competitorDomain = targets[targetKey]
      if (!link || !competitorDomain) continue
      items.push({
        competitorDomain,
        urlFrom: link.url_from ?? "",
        urlTo: link.url_to ?? "",
        anchor: link.anchor ?? "",
        domainRating: link.domain_from_rank ?? 0,
        title: link.page_from_title ?? "",
        textPre: link.text_pre ?? "",
        textPost: link.text_post ?? "",
      })
      break
    }
  }

  return { items, costUsd }
}
