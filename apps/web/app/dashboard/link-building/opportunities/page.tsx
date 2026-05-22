"use client"

import { IconLoader2, IconSearch } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
import { useEffect, useMemo, useState } from "react"

import { OpportunityCard } from "@/components/link-building/opportunities/opportunity-card"
import { OpportunityFilters } from "@/components/link-building/opportunities/opportunity-filters"
import { StatusTabs } from "@/components/link-building/opportunities/status-tabs"
import { captureEvent } from "@/lib/analytics"
import { useProspectStore } from "@/stores/prospect-store"

import {
  type ProspectStatus,
  type ProspectTier,
} from "./_data"

type StatusFilter = ProspectStatus | "all"
type TypeFilter = ProspectTier | "all"

export default function OpportunitiesPage() {
  const prospects = useProspectStore((state) => state.prospects)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("new")
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all")
  const [search, setSearch] = useState("")

  useEffect(() => {
    captureEvent("opportunities_list_viewed", { count: prospects.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const statusCounts = useMemo(() => {
    const counts = {
      new: 0,
      submitted: 0,
      contacted: 0,
      replied: 0,
      won: 0,
      dismissed: 0,
    } satisfies Record<ProspectStatus, number>

    prospects.forEach((p) => {
      counts[p.status] += 1
    })

    return counts
  }, [prospects])

  const typeCounts = useMemo(() => {
    const counts = {
      competitor_backlink: 0,
      unlinked_mention: 0,
      media_mention: 0,
    } satisfies Record<ProspectTier, number>

    prospects.forEach((p) => {
      counts[p.tier] += 1
    })

    return counts
  }, [prospects])

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return prospects.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false
      if (typeFilter !== "all" && p.tier !== typeFilter) return false
      if (!query) return true

      return (
        p.domain.toLowerCase().includes(query) ||
        p.target_url.toLowerCase().includes(query)
      )
    })
  }, [prospects, statusFilter, typeFilter, search])

  const sorted = useMemo(
    () =>
      [...filtered].sort(
        (a, b) =>
          new Date(b.discovered_at).getTime() -
          new Date(a.discovered_at).getTime()
      ),
    [filtered]
  )

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "new" ||
    typeFilter !== "all"

  function clearFilters() {
    setSearch("")
    setStatusFilter("new")
    setTypeFilter("all")
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="border-b border-border/70 pb-5">
        <div className="max-w-2xl">
          <h1 className="flex items-center font-heading text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
            <IconSearch className="mr-2 size-8" />
            Opportunity queue
          </h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">
            Prioritized sites and outreach paths where there is a realistic next
            action toward a backlink.
          </p>
        </div>
      </div>

      {prospects.length === 0 ? (
        <Card className="px-6 py-16 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10">
              <IconLoader2 className="size-5 animate-spin text-primary" />
            </span>
            <h2 className="text-base font-semibold text-foreground">
              Building your opportunity queue
            </h2>
            <p className="text-sm text-muted-foreground">
              We&apos;re analyzing your site and competitors to surface relevant
              backlink opportunities. This usually takes a few minutes — check
              back shortly.
            </p>
          </div>
        </Card>
      ) : (
        <div className="flex flex-col gap-4">
          <StatusTabs
            value={statusFilter}
            counts={statusCounts}
            total={prospects.length}
            onChange={setStatusFilter}
          />

          <OpportunityFilters
            search={search}
            typeFilter={typeFilter}
            typeCounts={typeCounts}
            total={prospects.length}
            hasActiveFilters={hasActiveFilters}
            onSearchChange={setSearch}
            onTypeChange={setTypeFilter}
            onClear={clearFilters}
          />

          {sorted.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">
              No opportunities match these filters.
            </p>
          ) : (
            <div className="flex flex-col gap-2">
              {sorted.map((prospect) => (
                <OpportunityCard key={prospect.id} prospect={prospect} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
