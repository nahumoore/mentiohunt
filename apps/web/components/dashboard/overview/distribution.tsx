import { IconChartBar } from "@tabler/icons-react"

import { PROSPECT_TIER_CONFIG, type ProspectTier } from "@/lib/opportunity-types"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

import type { OverviewMetrics } from "./_metrics"

const TIER_ORDER: ProspectTier[] = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
]

// Distinct shades from the brand orange ramp so each bar reads apart.
const TIER_BAR: Record<ProspectTier, string> = {
  competitor_backlink:
    "from-(--color-crimson-carrot) to-(--color-blaze-orange-2)",
  unlinked_mention: "from-(--color-blaze-orange-2) to-(--color-harvest-orange)",
  listicle_roundup: "from-(--color-harvest-orange) to-(--color-deep-saffron)",
  resource_page_inclusion: "from-(--color-deep-saffron) to-(--color-orange)",
}

export function ByOpportunityType({ metrics }: { metrics: OverviewMetrics }) {
  const maxTierCount = Math.max(
    1,
    ...TIER_ORDER.map((tier) => metrics.tierCounts[tier])
  )

  return (
    <Card>
      <CardHeader className="flex items-center gap-3 space-y-0">
        <span className="flex size-9 items-center justify-center rounded-xl bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
          <IconChartBar className="size-5" />
        </span>
        <h3 className="font-heading text-base font-semibold text-foreground">
          By opportunity type
        </h3>
      </CardHeader>
      <CardContent>
        {metrics.total === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <IconChartBar className="size-6 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No prospects to break down yet.
            </p>
          </div>
        ) : (
          <ul className="flex flex-col gap-4">
            {TIER_ORDER.map((tier) => {
              const config = PROSPECT_TIER_CONFIG[tier]
              const TierIcon = config.icon
              const count = metrics.tierCounts[tier]
              const width = (count / maxTierCount) * 100
              const share =
                metrics.total > 0
                  ? Math.round((count / metrics.total) * 100)
                  : 0

              return (
                <li key={tier} className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <TierIcon className="size-4 text-muted-foreground" />
                      {config.label}
                    </span>
                    <span className="flex items-baseline gap-1.5 tabular-nums">
                      <span className="text-sm font-bold text-foreground">
                        {count}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {share}%
                      </span>
                    </span>
                  </div>
                  <span className="h-2 w-full overflow-hidden rounded-full bg-muted">
                    <span
                      className={`block h-full rounded-full bg-gradient-to-r ${TIER_BAR[tier]} transition-[width] duration-500 ease-out`}
                      style={{ width: `${Math.max(width, count > 0 ? 6 : 0)}%` }}
                    />
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}

