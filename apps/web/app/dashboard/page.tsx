"use client"

import { IconLoader2 } from "@tabler/icons-react"
import { Card } from "@workspace/ui/components/card"

import { DashboardOverview } from "@/components/dashboard/overview/dashboard-overview"
import { useProspectStore } from "@/stores/prospect-store"

export default function DashboardHomePage() {
  const prospects = useProspectStore((state) => state.prospects)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  if (prospects.length === 0 && !hasCompletedRun) {
    return (
      <Card className="rounded-xl border border-border px-6 py-16 text-center shadow-sm">
        <div className="mx-auto flex max-w-md flex-col items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
            <IconLoader2 className="size-5 animate-spin text-(--color-blaze-orange)" />
          </span>
          <h2 className="text-base font-semibold text-foreground">
            Building your prospect queue
          </h2>
          <p className="text-sm text-muted-foreground">
            We&apos;re analyzing your site and competitors to surface relevant
            backlink prospects. This usually takes a few minutes —
            you&apos;ll receive an email once done!
          </p>
        </div>
      </Card>
    )
  }

  return <DashboardOverview />
}
