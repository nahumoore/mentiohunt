import type { ProspectStatus } from "@/app/dashboard/prospects/_data"
import type { ProspectListItem } from "@/stores/prospect-store"
import type { ProspectTier } from "@/lib/opportunity-types"

const ALL_STATUSES: ProspectStatus[] = [
  "new",
  "contacted",
  "negotiating",
  "won",
  "dismissed",
  "email_not_found",
  "bounced",
]

const ALL_TIERS: ProspectTier[] = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
]

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

export type OverviewMetrics = {
  total: number
  statusCounts: Record<ProspectStatus, number>
  tierCounts: Record<ProspectTier, number>
  newCount: number
  contactedCount: number
  negotiatingCount: number
  wonCount: number
  emailNotFoundCount: number
  bouncedCount: number
  recentProspects: ProspectListItem[]
  /** Prospects discovered in the last 7 days, regardless of current status. */
  discoveredThisWeekCount: number
  /** Share of currently-new prospects that have already been contacted. */
  contactedShareOfNewPct: number
}

export function buildOverviewMetrics(
  prospects: ProspectListItem[]
): OverviewMetrics {
  const statusCounts = Object.fromEntries(
    ALL_STATUSES.map((status) => [
      status,
      prospects.filter((p) => p.status === status).length,
    ])
  ) as Record<ProspectStatus, number>

  const tierCounts = Object.fromEntries(
    ALL_TIERS.map((tier) => [
      tier,
      prospects.filter((p) => p.tier === tier).length,
    ])
  ) as Record<ProspectTier, number>

  const now = Date.now()
  const discoveredThisWeekCount = prospects.filter(
    (p) => now - new Date(p.discovered_at).getTime() <= ONE_WEEK_MS
  ).length

  const contactedShareOfNewPct =
    statusCounts.new > 0
      ? Math.round((statusCounts.contacted / statusCounts.new) * 100)
      : 0

  return {
    total: prospects.length,
    statusCounts,
    tierCounts,
    newCount: statusCounts.new,
    contactedCount: statusCounts.contacted,
    negotiatingCount: statusCounts.negotiating,
    wonCount: statusCounts.won,
    emailNotFoundCount: statusCounts.email_not_found,
    bouncedCount: statusCounts.bounced,
    // prospects is already sorted discovered_at desc by the store hydrator
    recentProspects: prospects.slice(0, 5),
    discoveredThisWeekCount,
    contactedShareOfNewPct,
  }
}
