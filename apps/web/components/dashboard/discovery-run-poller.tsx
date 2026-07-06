"use client"

import { useEffect } from "react"

import {
  computeHasCompletedRun,
  isDiscoveryRunning,
  type ProspectRunItem,
} from "@/lib/prospect-runs"
import { useProspectStore, type ProspectListItem } from "@/stores/prospect-store"

const POLL_INTERVAL_MS = 5_000
// Post-onboarding grace window: run rows may not exist yet when the user lands
// on the dashboard. Keep polling ~3 min before concluding nothing is coming
// (the onboarding summary email covers the server-failure case).
const MAX_EMPTY_POLLS = 36
const MAX_CONSECUTIVE_FAILURES = 5

type DiscoveryStatusPayload = {
  runs: ProspectRunItem[]
  prospects: ProspectListItem[]
}

function newestDiscoveredAt(prospects: ProspectListItem[]): string | null {
  let max: string | null = null
  for (const prospect of prospects) {
    if (prospect.discovered_at && (!max || prospect.discovered_at > max)) {
      max = prospect.discovered_at
    }
  }
  return max
}

export function DiscoveryRunPoller() {
  const discovering = useProspectStore((state) => isDiscoveryRunning(state.runs))
  const awaitingFirstRun = useProspectStore(
    (state) =>
      state.runs.length === 0 &&
      state.prospects.length === 0 &&
      !state.hasCompletedRun
  )
  const shouldPoll = discovering || awaitingFirstRun

  useEffect(() => {
    if (!shouldPoll) return

    let cancelled = false
    let timer: ReturnType<typeof setTimeout>
    let emptyPolls = 0
    let failures = 0

    const schedule = () => {
      timer = setTimeout(tick, POLL_INTERVAL_MS)
    }

    const tick = async () => {
      if (cancelled) return
      if (document.hidden) {
        schedule()
        return
      }

      try {
        const since = newestDiscoveredAt(useProspectStore.getState().prospects)
        const response = await fetch(
          `/api/link-building/discovery-status${since ? `?since=${encodeURIComponent(since)}` : ""}`
        )
        if (!response.ok) throw new Error(`discovery-status ${response.status}`)
        const payload = (await response.json()) as DiscoveryStatusPayload
        if (cancelled) return

        failures = 0
        const store = useProspectStore.getState()
        store.setRuns(payload.runs)
        store.upsertProspects(payload.prospects)
        store.setHasCompletedRun(computeHasCompletedRun(payload.runs))

        if (payload.runs.length === 0) {
          emptyPolls += 1
          if (emptyPolls >= MAX_EMPTY_POLLS) return
        } else if (!isDiscoveryRunning(payload.runs)) {
          return
        }
      } catch {
        failures += 1
        if (failures >= MAX_CONSECUTIVE_FAILURES) return
      }

      schedule()
    }

    schedule()

    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [shouldPoll])

  return null
}
