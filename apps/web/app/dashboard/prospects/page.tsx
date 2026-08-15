"use client"

import { useEffect } from "react"

import { OpportunityPipeline } from "@/components/link-building/prospects/prospect-pipeline"
import { DiscoveryFoundNothing } from "@/components/dashboard/discovery-found-nothing"
import { DiscoveryInProgress } from "@/components/dashboard/discovery-in-progress"
import { captureEvent } from "@/lib/analytics"
import { useProspectStore } from "@/stores/prospect-store"

export default function ProspectsPage() {
  const prospects = useProspectStore((state) => state.prospects)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  useEffect(() => {
    captureEvent("opportunities_list_viewed", { count: prospects.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (prospects.length === 0 && !hasCompletedRun) {
    return <DiscoveryInProgress />
  }

  if (prospects.length === 0) {
    return <DiscoveryFoundNothing />
  }

  return <OpportunityPipeline prospects={prospects} />
}
