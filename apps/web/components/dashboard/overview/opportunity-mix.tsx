import { IconChartDonut } from "@tabler/icons-react"

import { PROSPECT_TIER_CONFIG, type ProspectTier } from "@/lib/opportunity-types"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"

import type { OverviewMetrics } from "./_metrics"

const TIER_ORDER: ProspectTier[] = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
  "broken_link_building",
  "user_submitted",
]

// Same brand-orange ramp used for the opportunity-type bars, so the two
// cards read as one connected breakdown.
const TIER_RING_COLOR: Record<ProspectTier, string> = {
  competitor_backlink: "var(--color-crimson-carrot)",
  unlinked_mention: "var(--color-blaze-orange-2)",
  listicle_roundup: "var(--color-harvest-orange)",
  resource_page_inclusion: "var(--color-deep-saffron)",
  broken_link_building: "#f43f5e",
  // Outside the ramp on purpose — user-triggered, not a rotation strategy.
  user_submitted: "#0ea5e9",
}

const RADIUS = 52
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function OpportunityMix({ metrics }: { metrics: OverviewMetrics }) {
  let cumulative = 0
  const arcs = TIER_ORDER.map((tier) => metrics.tierCounts[tier])
    .map((count, i) => ({ tier: TIER_ORDER[i]!, count }))
    .filter((segment) => segment.count > 0)
    .map((segment) => {
      const share = segment.count / metrics.total
      const length = share * CIRCUMFERENCE
      const arc = {
        ...segment,
        pct: Math.round(share * 100),
        dasharray: `${length} ${CIRCUMFERENCE - length}`,
        dashoffset: -cumulative,
      }
      cumulative += length
      return arc
    })

  return (
    <Card>
      <CardHeader className="flex items-center gap-3 space-y-0">
        <span className="flex size-9 items-center justify-center rounded-xl bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
          <IconChartDonut className="size-5" />
        </span>
        <h3 className="font-heading text-base font-semibold text-foreground">
          Mix
        </h3>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col">
        {metrics.total === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 py-8 text-center">
            <IconChartDonut className="size-6 text-muted-foreground/60" />
            <p className="text-sm text-muted-foreground">
              No opportunities to break down yet.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-1 items-center justify-center py-2">
              <svg width="148" height="148" viewBox="0 0 132 132">
                <circle
                  cx="66"
                  cy="66"
                  r={RADIUS}
                  fill="none"
                  strokeWidth="18"
                  className="stroke-muted"
                />
                {arcs.map((arc) => (
                  <circle
                    key={arc.tier}
                    cx="66"
                    cy="66"
                    r={RADIUS}
                    fill="none"
                    strokeWidth="18"
                    strokeLinecap="round"
                    stroke={TIER_RING_COLOR[arc.tier]}
                    strokeDasharray={arc.dasharray}
                    strokeDashoffset={arc.dashoffset}
                    transform="rotate(-90 66 66)"
                  >
                    <title>{PROSPECT_TIER_CONFIG[arc.tier].label}</title>
                  </circle>
                ))}
                <text
                  x="66"
                  y="63"
                  textAnchor="middle"
                  className="fill-foreground font-heading font-extrabold"
                  style={{ fontSize: 26 }}
                >
                  {metrics.total}
                </text>
                <text
                  x="66"
                  y="81"
                  textAnchor="middle"
                  className="fill-muted-foreground font-ui font-semibold"
                  style={{ fontSize: 10, letterSpacing: 1 }}
                >
                  TOTAL
                </text>
              </svg>
            </div>

            <ul className="flex flex-col gap-2.5">
              {arcs.map((arc) => (
                <li
                  key={arc.tier}
                  className="flex items-center gap-2 text-sm font-medium text-foreground"
                >
                  <span
                    className="size-2.5 shrink-0 rounded-[3px]"
                    style={{ backgroundColor: TIER_RING_COLOR[arc.tier] }}
                  />
                  <span className="truncate">
                    {PROSPECT_TIER_CONFIG[arc.tier].label}
                  </span>
                  <span className="ml-auto text-muted-foreground">
                    {arc.pct}%
                  </span>
                </li>
              ))}
            </ul>
          </>
        )}
      </CardContent>
    </Card>
  )
}
