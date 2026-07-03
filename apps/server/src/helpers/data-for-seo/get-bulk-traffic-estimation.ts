import { dataForSeoPost } from "./client.js"

type TrafficItem = {
  target?: string | null
  metrics?: {
    organic?: {
      etv?: number | null
    } | null
  } | null
}

type GetBulkTrafficEstimationResult = {
  items?: TrafficItem[] | null
}

function normalizeTarget(raw: string): string {
  const trimmed = raw.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

export async function getBulkTrafficEstimation(
  targets: string[]
): Promise<{ trafficByTarget: Map<string, number | null>; costUsd: number }> {
  const normalizedTargets = targets.map(normalizeTarget)
  const { result, costUsd } = await dataForSeoPost<GetBulkTrafficEstimationResult>(
    "dataforseo_labs/google/bulk_traffic_estimation/live",
    {
      targets: normalizedTargets,
      include_subdomains: true,
      search_partners: false,
    }
  )

  const trafficByTarget = new Map<string, number | null>()
  for (const target of normalizedTargets) trafficByTarget.set(target, null)

  for (const item of result.items ?? []) {
    const target = item.target ? normalizeTarget(item.target) : null
    if (!target) continue
    const value = item.metrics?.organic?.etv
    trafficByTarget.set(target, typeof value === "number" && Number.isFinite(value) ? value : null)
  }

  return { trafficByTarget, costUsd }
}
