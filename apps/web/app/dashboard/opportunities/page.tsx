"use client"

import { IconLoader2 } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"
import { useEffect } from "react"

import { AllReviewedEmpty } from "@/components/link-building/opportunities/all-reviewed-empty"
import { OpportunityPipeline } from "@/components/link-building/opportunities/opportunity-pipeline"
import { captureEvent } from "@/lib/analytics"
import { useProspectStore } from "@/stores/prospect-store"

export default function OpportunitiesPage() {
  const prospects = useProspectStore((state) => state.prospects)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  useEffect(() => {
    captureEvent("opportunities_list_viewed", { count: prospects.length })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (prospects.length === 0 && !hasCompletedRun) {
    return (
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
            backlink opportunities. This usually takes a few minutes —
            you&apos;ll receive an email once done!
          </p>
        </div>
      </Card>
    )
  }

  if (prospects.length === 0) {
    return <AllReviewedEmpty />
  }

  return <OpportunityPipeline prospects={prospects} />
}
