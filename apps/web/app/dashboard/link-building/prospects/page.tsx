"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { IconChevronRight, IconSearch } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
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
      <div className="rounded-3xl border border-orange/20 bg-[linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-amber-glow)_10%,var(--color-card))_55%,var(--color-background)_100%)] p-4 shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
              <IconSearch className="size-7 shrink-0" />
              Backlink prospects
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Qualified sites where Mentiohunt found a realistic path to a
              backlink, ranked so your next move is obvious.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 lg:max-w-md lg:justify-end">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  "rounded-full px-3 py-1.5 text-xs font-semibold transition-all focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  statusFilter === f.value
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-background/60 text-muted-foreground ring-1 ring-border/70 hover:bg-orange/10 hover:text-foreground hover:ring-orange/30"
                )}
              >
                {f.label}
                {f.value !== "all" && (
                  <span className="ml-1.5 tabular-nums opacity-60">
                    {statusCounts[f.value]}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border/60">
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground">
                  Domain
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Fit score
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  DR
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Traffic
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                  Status
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
                    router.push(`/dashboard/link-building/prospects/${opp.id}`)
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
                    <ScoreBadge score={opp.fitScore} />
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
        </div>
      </Card>
    </div>
  )
}
