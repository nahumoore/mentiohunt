import { dataForSeoPost } from "./client.js"

export type DataForSeoBacklinkItem = {
  url_from?: string | null
  url_to?: string | null
  anchor?: string | null
  domain_from_rank?: number | null
  page_from_title?: string | null
  text_pre?: string | null
  text_post?: string | null
  dofollow?: boolean | null
}

type GetBacklinksResult = {
  total_count: number
  items_count: number
  search_after_token: string | null
  items: DataForSeoBacklinkItem[] | null
}

type GetBacklinksParams = {
  target: string
  drMin?: number
  drMax?: number | null
  limit?: number
  searchAfterToken?: string | null
}

export async function getBacklinks(
  params: GetBacklinksParams
): Promise<{ items: DataForSeoBacklinkItem[]; searchAfterToken: string | null; costUsd: number }> {
  const { target, drMin = 0, drMax = null, limit = 50, searchAfterToken } = params

  const filters: unknown[] = [["dofollow", "=", true]]
  if (drMin > 0) {
    filters.push("and", ["domain_from_rank", ">=", drMin])
  }
  if (drMax !== null) {
    filters.push("and", ["domain_from_rank", "<=", drMax])
  }

  const task: Record<string, unknown> = {
    target,
    mode: "one_per_domain",
    rank_scale: "one_hundred",
    backlinks_status_type: "live",
    exclude_internal_backlinks: true,
    order_by: ["rank,desc"],
    limit,
    filters,
  }

  if (searchAfterToken) {
    task["search_after_token"] = searchAfterToken
  }

  const { result, costUsd } = await dataForSeoPost<GetBacklinksResult>(
    "backlinks/backlinks/live",
    task
  )

  return {
    items: result.items ?? [],
    searchAfterToken: result.search_after_token ?? null,
    costUsd,
  }
}
