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
import { useMemo, useState } from "react"

import type { ProspectStatus } from "@/app/dashboard/prospects/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

import { PoolCapacityBanner } from "./pool-capacity-banner"
import { OpportunityPipelineRow } from "./prospect-pipeline-row"
import { StatusOverviewV1 } from "./prospect-status-overview"

type StageValue = "all" | ProspectStatus

type SortKey = "contact" | "domain" | "dr" | "relevance"
type SortDir = "asc" | "desc"

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
  const [activeStage, setActiveStage] = useState<StageValue>("new")
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
      <PoolCapacityBanner />
      <StatusOverviewV1
        prospects={prospects}
        activeStage={activeStage}
        onStageChange={(s) => setActiveStage(s as StageValue)}
      />

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <TooltipProvider>
          <table className="w-full table-fixed">
            <colgroup>
              <col className="w-[22%]" />
              <col className="w-[10%]" />
              <col className="w-[16%]" />
              <col className="w-[30%]" />
              <col className="w-[12%]" />
              <col className="w-[10%]" />
            </colgroup>
            <thead>
              <tr className="border-b border-border/60 bg-muted/20">
                <th className="py-3 pr-3 pl-6 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
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
                <th className="px-3 py-3 text-left text-[0.65rem] font-bold tracking-wider text-muted-foreground/60 uppercase">
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
                    No prospects in this stage.
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
