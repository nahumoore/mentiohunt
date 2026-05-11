"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconChevronRight, IconInfoCircle } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import {
  MOCK_OPPORTUNITIES,
  TYPE_CONFIG,
  STATUS_CONFIG,
  formatTraffic,
  scoreColor,
  type OpportunityStatus,
  type OpportunityType,
} from "./_data"

const STATUS_FILTERS: { value: OpportunityStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "new", label: "New" },
  { value: "contacted", label: "Contacted" },
  { value: "replied", label: "Replied" },
  { value: "won", label: "Won" },
  { value: "dismissed", label: "Dismissed" },
]

function ScoreBadge({ score }: { score: number }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums",
        scoreColor(score)
      )}
    >
      {score}
    </span>
  )
}

function TypeBadge({ type }: { type: OpportunityType }) {
  const cfg = TYPE_CONFIG[type]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function StatusBadge({ status }: { status: OpportunityStatus }) {
  const cfg = STATUS_CONFIG[status]
  const Icon = cfg.icon
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        cfg.color
      )}
    >
      <Icon className="size-3" />
      {cfg.label}
    </span>
  )
}

function ColumnHeader({
  label,
  description,
}: {
  label: string
  description: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span>{label}</span>
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${label}`}
            className="rounded-full text-muted-foreground/70 transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none"
            onClick={(event) => event.stopPropagation()}
          >
            <IconInfoCircle className="size-3.5" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="top" align="start">
          {description}
        </TooltipContent>
      </Tooltip>
    </div>
  )
}

export default function OpportunitiesPage() {
  const router = useRouter()
  const [statusFilter, setStatusFilter] = useState<OpportunityStatus | "all">(
    "all"
  )

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_FILTERS.filter((f) => f.value !== "all").map((f) => [f.value, 0])
    ) as Record<OpportunityStatus, number>

    MOCK_OPPORTUNITIES.forEach((opp) => {
      counts[opp.status] += 1
    })

    return counts
  }, [])

  const filtered = useMemo(() => {
    if (statusFilter === "all") return MOCK_OPPORTUNITIES
    return MOCK_OPPORTUNITIES.filter((o) => o.status === statusFilter)
  }, [statusFilter])

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 flex items-center gap-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
              <span>Backlink prospects</span>
              <span className="h-px w-8 bg-orange" />
              <span className="tabular-nums">{filtered.length} shown</span>
            </div>
            <h1 className="font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
              Opportunity queue
            </h1>
            <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
              Prioritized sites where there is a realistic path to a backlink.
            </p>
          </div>

          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border/70 bg-card p-1 shadow-sm">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  statusFilter === f.value
                    ? "bg-orange text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {f.label}
                <span className="ml-1.5 tabular-nums opacity-65">
                  {f.value === "all"
                    ? MOCK_OPPORTUNITIES.length
                    : statusCounts[f.value]}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <TooltipProvider>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Domain"
                      description="The site where this backlink opportunity was found."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Type"
                      description="The outreach angle or opportunity source for this prospect."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Backlink power"
                      description="Estimated authority and traffic value if this prospect links back."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="DR"
                      description="Domain rating, a shorthand for the site's backlink authority."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Traffic"
                      description="Estimated monthly organic visits to the prospect domain."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Status"
                      description="Where this prospect sits in your outreach workflow."
                    />
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-12 text-center text-sm text-muted-foreground"
                    >
                      No prospects with this status yet.
                    </td>
                  </tr>
                )}
                {filtered.map((opp) => (
                  <tr
                    key={opp.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/link-building/prospects/${opp.id}`
                      )
                    }
                    className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-medium">{opp.domain}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={opp.type} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ScoreBadge score={opp.backlinkPower} />
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {opp.domainRating}
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground tabular-nums">
                      {formatTraffic(opp.monthlyTraffic)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={opp.status} />
                    </td>
                    <td className="px-4 py-3.5">
                      <IconChevronRight className="size-4 text-muted-foreground" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TooltipProvider>
        </div>
      </Card>
    </div>
  )
}
