"use client"

import { useEffect } from "react"

import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import { supabaseClient } from "@/lib/supabase/client"
import { OPPORTUNITY_TYPE_TO_PROSPECT_TIER } from "@/lib/opportunity-types"
import { usePagesStore } from "@/stores/pages-store"
import { useProductStore } from "@/stores/product-store"
import { useProspectStore } from "@/stores/prospect-store"
import type { Tables } from "@workspace/supabase/database-types"

type ProspectRun = Pick<Tables<"backlink_prospect_runs">, "status" | "strategy">

const TERMINAL_RUN_STATUSES = new Set<ProspectRun["status"]>([
  "completed",
  "failed",
])

export function ProspectRealtimeSync() {
  const productId = useProductStore((state) => state.product?.id)
  const opportunityTypes = useDiscoverySettingsStore(
    (state) => state.settings?.opportunityTypes
  )
  const opportunityTypesKey = opportunityTypes?.join("|") ?? ""

  useEffect(() => {
    if (!productId) return

    const supabase = supabaseClient()
    const channels: ReturnType<typeof supabase.channel>[] = []
    let cancelled = false
    const expectedStrategies = new Set<ProspectRun["strategy"]>(
      (opportunityTypes ?? []).map(
        (type) => OPPORTUNITY_TYPE_TO_PROSPECT_TIER[type]
      )
    )
    const runStatusByStrategy = new Map<
      ProspectRun["strategy"],
      ProspectRun["status"]
    >()

    function updateRunStatus(row: ProspectRun) {
      if (!expectedStrategies.has(row.strategy)) return
      runStatusByStrategy.set(row.strategy, row.status)
    }

    function syncCompletedRunState() {
      if (expectedStrategies.size === 0) return

      const allExpectedRunsFinished = [...expectedStrategies].every(
        (strategy) => {
          const status = runStatusByStrategy.get(strategy)
          return status ? TERMINAL_RUN_STATUSES.has(status) : false
        }
      )

      if (allExpectedRunsFinished) {
        useProspectStore.getState().setHasCompletedRun(true)
      }
    }

    async function subscribe() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (error || !session?.access_token) {
        console.error("[ProspectRealtimeSync] missing session for realtime", error)
        return
      }

      supabase.realtime.setAuth(session.access_token)

      const { data: existingRuns, error: existingRunsError } = await supabase
        .from("backlink_prospect_runs")
        .select("strategy, status")
        .eq("product_id", productId)
        .order("started_at", { ascending: false })

      if (existingRunsError) {
        console.error(
          "[ProspectRealtimeSync] failed to fetch existing runs",
          existingRunsError
        )
      } else {
        for (const row of existingRuns ?? []) {
          if (!runStatusByStrategy.has(row.strategy)) {
            updateRunStatus(row)
          }
        }
        syncCompletedRunState()
      }

      const prospectsChannel = supabase
        .channel(`backlink_prospects:${productId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "backlink_prospects",
            filter: `product_id=eq.${productId}`,
          },
          (payload) => {
            console.log("[ProspectRealtimeSync] payload received:", payload)
            const row = payload.new as Tables<"backlink_prospects">
            if (!row?.id) return
            useProspectStore.getState().upsertProspectFromRealtime(row)
          }
        )
        .subscribe((status, err) => {
          console.log("[ProspectRealtimeSync] subscribe status:", status, err)
        })

      const prospectRunsChannel = supabase
        .channel(`backlink_prospect_runs:${productId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "backlink_prospect_runs",
            filter: `product_id=eq.${productId}`,
          },
          (payload) => {
            console.log("[ProspectRealtimeSync] run payload received:", payload)
            const row = payload.new as Tables<"backlink_prospect_runs">
            if (!row?.strategy) return
            updateRunStatus(row)
            syncCompletedRunState()
          }
        )
        .subscribe((status, err) => {
          console.log("[ProspectRealtimeSync] runs subscribe status:", status, err)
        })

      const pagesChannel = supabase
        .channel(`product_pages:${productId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "product_pages",
            filter: `product_id=eq.${productId}`,
          },
          (payload) => {
            console.log("[ProspectRealtimeSync] page payload received:", payload)

            if (payload.eventType === "DELETE") {
              const row = payload.old as Pick<Tables<"product_pages">, "id">
              if (row?.id) {
                usePagesStore.getState().removePage(row.id)
              }
              return
            }

            const row = payload.new as Tables<"product_pages">
            if (!row?.id) return

            usePagesStore.getState().upsertPage({
              id: row.id,
              url: row.url,
              title: row.title,
              description: row.description,
              page_type: row.page_type,
              priority: row.priority,
            })
          }
        )
        .subscribe((status, err) => {
          console.log("[ProspectRealtimeSync] pages subscribe status:", status, err)
        })

      channels.push(prospectsChannel, prospectRunsChannel, pagesChannel)
    }

    subscribe()

    return () => {
      cancelled = true
      for (const channel of channels) {
        supabase.removeChannel(channel)
      }
    }
  }, [productId, opportunityTypes, opportunityTypesKey])

  return null
}
