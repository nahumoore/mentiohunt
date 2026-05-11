"use client"

import { useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { IconChevronRight, IconExternalLink, IconInfoCircle } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"

import { useProspectStore } from "@/stores/prospect-store"
import {
  ACTION_TYPE_CONFIG,
  STATUS_CONFIG,
  STATUS_FILTERS,
  TYPE_CONFIG,
  formatDate,
  type ProspectActionType,
  type ProspectStatus,
  type ProspectTier,
} from "./_data"

function TypeBadge({ type }: { type: ProspectTier }) {
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

function ActionBadge({ actionType }: { actionType: ProspectActionType }) {
  const cfg = ACTION_TYPE_CONFIG[actionType]
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

function StatusBadge({ status }: { status: ProspectStatus }) {
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

function getTargetLabel(targetUrl: string) {
  try {
    const url = new URL(targetUrl)
    return `${url.hostname.replace(/^www\./, "")}${url.pathname === "/" ? "" : url.pathname}`
  } catch {
    return targetUrl
  }
}

export default function ProspectsPage() {
  const router = useRouter()
  const prospects = useProspectStore((state) => state.prospects)
  const [statusFilter, setStatusFilter] = useState<ProspectStatus | "all">(
    "all"
  )

  const statusCounts = useMemo(() => {
    const counts = Object.fromEntries(
      STATUS_FILTERS.filter((filter) => filter.value !== "all").map((filter) => [
        filter.value,
        0,
      ])
    ) as Record<ProspectStatus, number>

    prospects.forEach((prospect) => {
      counts[prospect.status] += 1
    })

    return counts
  }, [prospects])

  const filtered = useMemo(() => {
    if (statusFilter === "all") return prospects
    return prospects.filter((prospect) => prospect.status === statusFilter)
  }, [prospects, statusFilter])

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
              Prioritized sites and submission paths where there is a realistic
              next action toward a backlink.
            </p>
          </div>

          <div className="flex max-w-full gap-1 overflow-x-auto rounded-full border border-border/70 bg-card p-1 shadow-sm">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter.value}
                onClick={() => setStatusFilter(filter.value)}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background focus-visible:outline-none",
                  statusFilter === filter.value
                    ? "bg-orange text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {filter.label}
                <span className="ml-1.5 tabular-nums opacity-65">
                  {filter.value === "all"
                    ? prospects.length
                    : statusCounts[filter.value]}
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
                      description="The prospect source or opportunity class."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Action"
                      description="The recommended next step for this prospect."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Target"
                      description="The page to review, submit through, or use for outreach context."
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-muted-foreground">
                    <ColumnHeader
                      label="Discovered"
                      description="When Mentiohunt added this prospect to your queue."
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
                      {prospects.length === 0
                        ? "No backlink prospects yet. Add discovery inputs so Mentiohunt can build your queue."
                        : "No prospects with this status yet."}
                    </td>
                  </tr>
                )}
                {filtered.map((prospect) => (
                  <tr
                    key={prospect.id}
                    onClick={() =>
                      router.push(
                        `/dashboard/link-building/prospects/${prospect.id}`
                      )
                    }
                    className="cursor-pointer border-b border-border/40 transition-colors last:border-0 hover:bg-muted/40"
                  >
                    <td className="px-6 py-3.5">
                      <span className="font-medium">{prospect.domain}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <TypeBadge type={prospect.tier} />
                    </td>
                    <td className="px-4 py-3.5">
                      <ActionBadge actionType={prospect.action_type} />
                    </td>
                    <td className="max-w-[280px] px-4 py-3.5">
                      <a
                        href={prospect.target_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex min-w-0 items-center gap-1.5 text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <IconExternalLink className="size-3.5 shrink-0" />
                        <span className="truncate">
                          {getTargetLabel(prospect.target_url)}
                        </span>
                      </a>
                    </td>
                    <td className="px-4 py-3.5 text-muted-foreground whitespace-nowrap tabular-nums">
                      {formatDate(prospect.discovered_at)}
                    </td>
                    <td className="px-4 py-3.5">
                      <StatusBadge status={prospect.status} />
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
