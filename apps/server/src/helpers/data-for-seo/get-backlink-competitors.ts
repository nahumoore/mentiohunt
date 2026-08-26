import { dataForSeoPost } from "./client.js"

type BacklinkCompetitor = {
  target?: string | null
  rank?: number | null
  intersections?: number | null
}

type BacklinkCompetitorsResult = {
  items?: BacklinkCompetitor[] | null
}

export async function getBacklinkCompetitors(
  target: string,
  limit = 10
): Promise<{ domains: string[]; costUsd: number }> {
  const { result, costUsd } = await dataForSeoPost<BacklinkCompetitorsResult>(
    "backlinks/competitors/live",
    {
      target,
      main_domain: true,
      exclude_large_domains: true,
      exclude_internal_backlinks: true,
      rank_scale: "one_hundred",
      order_by: ["intersections,desc", "rank,desc"],
      limit,
    }
  )

  return {
    domains: (result.items ?? [])
      .map((item) => item.target?.replace(/^www\./i, "").toLowerCase() ?? "")
      .filter(Boolean),
    costUsd,
  }
}
