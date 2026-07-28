"use client"

import { useEffect } from "react"

import { AllReviewedEmpty } from "@/components/link-building/prospects/all-reviewed-empty"
import { OpportunityPipeline } from "@/components/link-building/prospects/prospect-pipeline"
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
    return <AllReviewedEmpty />
  }

  return <OpportunityPipeline prospects={prospects} />
}
