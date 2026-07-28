"use client"

import { DiscoveryInProgress } from "@/components/dashboard/discovery-in-progress"
import { DashboardOverview } from "@/components/dashboard/overview/dashboard-overview"
import { DashboardOverviewSkeleton } from "@/components/dashboard/overview/dashboard-overview-skeleton"
import { useProspectStore } from "@/stores/prospect-store"

export default function DashboardHomePage() {
  const hydrated = useProspectStore((state) => state.hydrated)
  const prospects = useProspectStore((state) => state.prospects)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  if (!hydrated) {
    return <DashboardOverviewSkeleton />
  }

  if (prospects.length === 0 && !hasCompletedRun) {
    return <DiscoveryInProgress />
  }

  return <DashboardOverview />
}
