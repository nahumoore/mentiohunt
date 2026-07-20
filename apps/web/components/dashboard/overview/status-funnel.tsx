import { IconTrendingUp } from "@tabler/icons-react"

import { STATUS_CONFIG, type ProspectStatus } from "@/app/dashboard/prospects/_data"
import { cn } from "@workspace/ui/lib/utils"

import type { OverviewMetrics } from "./_metrics"

// The outreach funnel, in the order a prospect actually moves through it.
const FUNNEL_ORDER: ProspectStatus[] = [
  "new",
  "contacted",
  "negotiating",
  "won",
]

function getContext(status: ProspectStatus, metrics: OverviewMetrics) {
  switch (status) {
    case "new":
      return metrics.discoveredThisWeekCount > 0 ? (
        <span className="flex items-center gap-1 text-xs font-semibold text-green-600">
          <IconTrendingUp className="size-3.5" stroke={2.5} />
          {metrics.discoveredThisWeekCount} this week
        </span>
      ) : (
        <span className="text-xs font-medium text-muted-foreground">
          no new this week
        </span>
      )
    case "contacted":
      return (
        <span className="text-xs font-medium text-muted-foreground">
          {metrics.newCount > 0 ? `${metrics.contactedShareOfNewPct}% of new` : "—"}
        </span>
      )
    case "negotiating":
      return (
        <span className="text-xs font-medium text-muted-foreground">
          awaiting replies
        </span>
      )
    case "won":
      return (
        <span className="text-xs font-medium text-muted-foreground">
          links live
        </span>
      )
  }
}

export function StatusFunnel({ metrics }: { metrics: OverviewMetrics }) {
  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-border bg-border shadow-sm sm:grid-cols-4">
      {FUNNEL_ORDER.map((status) => {
        const config = STATUS_CONFIG[status]
        const Icon = config.icon
        const count = metrics.statusCounts[status]

        return (
          <div
            key={status}
            className="flex flex-col gap-4 bg-card px-6 py-5"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-ui text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {config.label}
              </span>
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-lg",
                  config.color
                )}
              >
                <Icon className="size-3.5" stroke={2} />
              </span>
            </div>

            <span className="font-heading text-4xl font-bold tabular-nums tracking-tight text-foreground">
              {count}
            </span>

            {getContext(status, metrics)}
          </div>
        )
      })}
    </div>
  )
}
