"use client"

import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
  IconInfoCircle,
} from "@tabler/icons-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"
import { cn } from "@workspace/ui/lib/utils"
import { useMemo, useState } from "react"

import type { ProspectStatus } from "@/app/dashboard/opportunities/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

import { OpportunityPipelineRow } from "./opportunity-pipeline-row"

type StageValue = "all" | ProspectStatus

interface Stage {
  value: StageValue
  label: string
  dotClass: string
}

const PIPELINE_STAGES: Stage[] = [
  { value: "all", label: "All", dotClass: "bg-primary" },
  { value: "new", label: "New", dotClass: "bg-blue-400" },
  { value: "contacted", label: "Contacted", dotClass: "bg-amber-400" },
  { value: "dismissed", label: "Dismissed", dotClass: "bg-slate-400" },
]

type SortKey = "contact" | "domain" | "dr" | "relevance"
type SortDir = "asc" | "desc"

function stageCount(prospects: ProspectListItem[], value: StageValue): number {
  if (value === "all") return prospects.length
  return prospects.filter((p) => p.status === value).length
}

function sortProspects(
  list: ProspectListItem[],
  key: SortKey,
  dir: SortDir
): ProspectListItem[] {
  return [...list].sort((a, b) => {
    let cmp = 0
    if (key === "contact")
      cmp = (a.contact_name ?? "").localeCompare(b.contact_name ?? "")
    else if (key === "domain")
      cmp = (a.domain ?? "").localeCompare(b.domain ?? "")
    else if (key === "dr")
      cmp = (a.domain_rating ?? 0) - (b.domain_rating ?? 0)
    else if (key === "relevance")
      cmp = (a.site_relevance_score ?? 0) - (b.site_relevance_score ?? 0)
    return dir === "asc" ? cmp : -cmp
  })
}

function SortButton({
  sortKey,
  activeKey,
  dir,
  onSort,
}: {
  sortKey: SortKey
  activeKey: SortKey
  dir: SortDir
  onSort: (k: SortKey) => void
}) {
  const active = sortKey === activeKey
  return (
    <button
      type="button"
      onClick={() => onSort(sortKey)}
      className="flex items-center text-muted-foreground/40 transition-colors hover:text-muted-foreground"
      aria-label={`Sort by ${sortKey}`}
    >
      {!active && <IconArrowsSort className="size-3.5" />}
      {active && dir === "asc" && (
        <IconArrowUp className="size-3.5 text-muted-foreground" />
      )}
      {active && dir === "desc" && (
        <IconArrowDown className="size-3.5 text-muted-foreground" />
      )}
    </button>
  )
}

interface OpportunityPipelineProps {
  prospects: ProspectListItem[]
}

export function OpportunityPipeline({ prospects }: OpportunityPipelineProps) {
  const [activeStage, setActiveStage] = useState<StageValue>("all")
  const [sortKey, setSortKey] = useState<SortKey>("contact")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("asc")
    }
  }

  const filtered = useMemo(() => {
    const base =
      activeStage === "all"
        ? [...prospects]
        : prospects.filter((p) => p.status === activeStage)
    return sortProspects(base, sortKey, sortDir)
  }, [prospects, activeStage, sortKey, sortDir])

  return (
    <div className="flex flex-col gap-3">
      {/* Stage filter bar */}
      <div className="flex items-center gap-0.5 overflow-x-auto">
        {PIPELINE_STAGES.map((stage, i) => {
          const isActive = activeStage === stage.value
          const count = stageCount(prospects, stage.value)
          return (
            <span
              key={stage.value}
              className="flex shrink-0 items-center gap-0.5"
            >
              {i > 0 && (
                <span className="mx-2 select-none text-border">·</span>
              )}
              <button
                type="button"
                onClick={() => setActiveStage(stage.value)}
                className={cn(
                  "relative inline-flex items-center gap-1.5 rounded px-1 py-1 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  isActive
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    stage.dotClass
                  )}
                />
                {stage.label}
                <span className="font-mono font-bold tabular-nums text-foreground">
                  {count}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1 right-1 h-px bg-primary" />
                )}
              </button>
            </span>
          )
        })}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-4xl bg-card shadow-md ring-1 ring-foreground/5">
        <TooltipProvider>
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[30%]" />
              <col className="w-[12%]" />
              <col className="w-[22%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60 bg-muted/30">
                <th className="py-3 pr-3 pl-6 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  <div className="flex items-center gap-1.5">
                    Contact
                    <SortButton
                      sortKey="contact"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  <div className="flex items-center gap-1.5">
                    Site
                    <SortButton
                      sortKey="domain"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  <div className="flex items-center gap-1.5">
                    DR
                    <SortButton
                      sortKey="dr"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                  </div>
                </th>
                <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  <div className="flex items-center gap-1.5">
                    Relevance
                    <SortButton
                      sortKey="relevance"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          className="flex items-center text-muted-foreground/50 transition-colors hover:text-muted-foreground"
                        >
                          <IconInfoCircle className="size-3.5" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="top">
                        Topical fit score based on content overlap and audience
                        alignment.
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </th>
                <th className="py-3 pr-6 pl-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-sm text-muted-foreground"
                  >
                    No opportunities in this stage.
                  </td>
                </tr>
              ) : (
                filtered.map((prospect) => (
                  <OpportunityPipelineRow
                    key={prospect.id}
                    prospect={prospect}
                  />
                ))
              )}
            </tbody>
          </table>
        </TooltipProvider>
      </div>
    </div>
  )
}
