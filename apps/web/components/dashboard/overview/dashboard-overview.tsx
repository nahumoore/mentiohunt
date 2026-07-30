"use client"

import { useMemo } from "react"

import { useProspectStore } from "@/stores/prospect-store"

import { buildOverviewMetrics } from "./_metrics"
import { ContactedOverTime } from "./contacted-over-time"
import { ByOpportunityType } from "./distribution"
import { OpportunityMix } from "./opportunity-mix"
import { StatusFunnel } from "./status-funnel"

export function DashboardOverview() {
  const prospects = useProspectStore((state) => state.prospects)

  const metrics = useMemo(() => buildOverviewMetrics(prospects), [prospects])

  return (
    <div className="flex flex-col gap-6">
      <StatusFunnel metrics={metrics} />
      <ContactedOverTime />
      <div className="grid gap-6 lg:grid-cols-[1.55fr_1fr]">
        <ByOpportunityType metrics={metrics} />
        <OpportunityMix metrics={metrics} />
      </div>
    </div>
  )
}
