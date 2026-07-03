import { dataForSeoPost } from "./client.js"

type GetBacklinksSummaryResult = {
  rank?: number | null
  backlinks?: number | null
  referring_domains?: number | null
}

export async function getBacklinksSummary(
  target: string,
  options: { dofollowOnly?: boolean } = {}
): Promise<{
  rank: number | null
  backlinks: number | null
  referringDomains: number | null
  costUsd: number
}> {
  const task: Record<string, unknown> = {
    target,
    exclude_internal_backlinks: true,
    backlinks_status_type: "live",
  }

  if (options.dofollowOnly) {
    task.backlinks_filters = ["dofollow", "=", true]
  }

  const { result, costUsd } = await dataForSeoPost<GetBacklinksSummaryResult>(
    "backlinks/summary/live",
    task
  )

  return {
    rank: typeof result.rank === "number" && Number.isFinite(result.rank) ? result.rank : null,
    backlinks:
      typeof result.backlinks === "number" && Number.isFinite(result.backlinks) ? result.backlinks : null,
    referringDomains:
      typeof result.referring_domains === "number" && Number.isFinite(result.referring_domains)
        ? result.referring_domains
        : null,
    costUsd,
  }
}
