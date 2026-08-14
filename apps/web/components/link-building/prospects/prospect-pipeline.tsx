"use client"

import {
  IconArrowDown,
  IconArrowsSort,
  IconArrowUp,
} from "@tabler/icons-react"
import { TooltipProvider } from "@workspace/ui/components/tooltip"
import { useMemo } from "react"

import { STATUS_FILTERS, type ProspectStatus } from "@/app/dashboard/prospects/_data"
import { useQueryState } from "@/hooks/use-query-state"
import type { ProspectListItem } from "@/stores/prospect-store"

import { PoolCapacityBanner } from "./pool-capacity-banner"
import { OpportunityCard } from "./prospect-card"
import { OpportunityPipelineRow } from "./prospect-pipeline-row"
import { StatusOverviewV1 } from "./prospect-status-overview"

type StageValue = "all" | ProspectStatus

type SortKey = "contact" | "domain" | "dr" | "discovered"
type SortDir = "asc" | "desc"

function sortProspects(
  list: ProspectListItem[],
  key: SortKey,
  dir: SortDir
): ProspectListItem[] {
  return [...list].sort((a, b) => {
    if (key === "contact") {
      const aEmpty = !a.contact_name
      const bEmpty = !b.contact_name
      if (aEmpty !== bEmpty) return aEmpty ? 1 : -1
      const cmp = (a.contact_name ?? "").localeCompare(b.contact_name ?? "")
      return dir === "asc" ? cmp : -cmp
    }
    let cmp = 0
    if (key === "domain")
      cmp = (a.domain ?? "").localeCompare(b.domain ?? "")
    else if (key === "dr")
      cmp = (a.domain_rating ?? 0) - (b.domain_rating ?? 0)
    else if (key === "discovered")
      cmp =
        new Date(a.discovered_at).getTime() -
        new Date(b.discovered_at).getTime()
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

function isStageValue(value: string): value is StageValue {
  return STATUS_FILTERS.some((filter) => filter.value === value)
}

function isSortKey(value: string): value is SortKey {
  return (
    value === "contact" ||
    value === "domain" ||
    value === "dr" ||
    value === "discovered"
  )
}

function isSortDir(value: string): value is SortDir {
  return value === "asc" || value === "desc"
}

/**
 * Stage/sort state lives in the URL (`?stage=`, `?sort=`, `?dir=`) so the
 * dashboard "Needs you" panel can deep-link straight to a stage (e.g.
 * `?stage=negotiating`) and so filter/sort choices survive reload and are
 * shareable/bookmarkable.
 */
export function OpportunityPipeline({ prospects }: OpportunityPipelineProps) {
  const [activeStage, setActiveStage] = useQueryState<StageValue>(
    "stage",
    "new",
    isStageValue
  )
  const [sortKey, setSortKey] = useQueryState<SortKey>(
    "sort",
    "contact",
    isSortKey
  )
  const [sortDir, setSortDir] = useQueryState<SortDir>("dir", "asc", isSortDir)

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
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

      {/* Mobile: stacked cards — the fixed-width table doesn't fit phone
          screens, so each prospect renders as a card instead of a row. */}
      <div className="flex flex-col gap-3 md:hidden">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-sm">
            No prospects in this stage.
          </div>
        ) : (
          filtered.map((prospect) => (
            <OpportunityCard key={prospect.id} prospect={prospect} />
          ))
        )}
      </div>

      {/* Desktop: table */}
      <div className="hidden overflow-hidden rounded-xl border border-border bg-card shadow-sm md:block">
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
                    Discovered
                    <SortButton
                      sortKey="discovered"
                      activeKey={sortKey}
                      dir={sortDir}
                      onSort={handleSort}
                    />
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
