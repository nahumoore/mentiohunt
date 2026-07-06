"use client"

import { useEffect } from "react"

import { AllReviewedEmpty } from "@/components/link-building/prospects/all-reviewed-empty"
import {
  DiscoveryProgressBanner,
  DiscoveryProgressPanel,
  DiscoveryZeroResultsEmpty,
} from "@/components/link-building/prospects/discovery-progress-panel"
import { OpportunityPipeline } from "@/components/link-building/prospects/prospect-pipeline"
import { captureEvent } from "@/lib/analytics"
import { isDiscoveryRunning } from "@/lib/prospect-runs"
import { useProspectStore } from "@/stores/prospect-store"

export default function ProspectsPage() {
  const prospects = useProspectStore((state) => state.prospects)
  const runs = useProspectStore((state) => state.runs)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  useEffect(() => {
    captureEvent("opportunities_list_viewed", { count: prospects.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (prospects.length > 0) {
    return (
      <>
        <DiscoveryProgressBanner />
        <OpportunityPipeline prospects={prospects} />
      </>
    )
  }

  const discovering =
    isDiscoveryRunning(runs) || (runs.length === 0 && !hasCompletedRun)

  if (discovering) {
    return <DiscoveryProgressPanel />
  }

  // Discovery finished with zero prospect rows: the run found nothing (or
  // failed), which needs different guidance than a reviewed-out queue.
  const totalCreated = runs.reduce(
    (sum, run) => sum + (run.prospects_created ?? 0),
    0
  )
  if (runs.length > 0 && totalCreated === 0) {
    return (
      <DiscoveryZeroResultsEmpty
        allFailed={runs.every((run) => run.status === "failed")}
      />
    )
  }

  return <AllReviewedEmpty />
}
