"use client"

import { useEffect } from "react"

import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import { supabaseClient } from "@/lib/supabase/client"
import {
  BROKEN_LINK_ELIGIBLE_PAGE_TYPES,
  OPPORTUNITY_TYPE_TO_PROSPECT_TIER,
  PAGE_GATED_PROSPECT_TIERS,
} from "@/lib/opportunity-types"
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
    // resource_page_inclusion/broken_link_building can never produce a
    // completed run without a crawled target page — don't wait on them
    // until one exists, or a product with none stays "in progress" forever.
    // Fail-safe default is true (still required) so a query error can't be
    // mistaken for "no pages" and prematurely mark discovery complete.
    let hasCrawledTargetPage = true
    let hasEligibleBrokenLinkPage = true
    let hasUsableCompetitor = true

    function updateRunStatus(row: ProspectRun) {
      if (!expectedStrategies.has(row.strategy)) return
      runStatusByStrategy.set(row.strategy, row.status)
    }

    function syncCompletedRunState() {
      if (expectedStrategies.size === 0) return

      const requiredStrategies = [...expectedStrategies].filter((strategy) => {
        if (strategy === "broken_link_building") {
          return hasEligibleBrokenLinkPage && hasUsableCompetitor
        }
        if (PAGE_GATED_PROSPECT_TIERS.has(strategy)) return hasCrawledTargetPage
        return true
      })

      const allExpectedRunsFinished =
        requiredStrategies.length > 0 &&
        requiredStrategies.every((strategy) => {
          const status = runStatusByStrategy.get(strategy)
          return status ? TERMINAL_RUN_STATUSES.has(status) : false
        })

      // Always reflects current state (not a one-way latch) — a page-gated
      // strategy becoming required again after a page gets crawled must be
      // able to flip this back to false, or the UI shows a stale "done".
      useProspectStore.getState().setHasCompletedRun(allExpectedRunsFinished)
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

      const [
        { count: crawledTargetPageCount, error: crawledTargetPageError },
        { count: eligibleBrokenLinkPageCount, error: eligibleBrokenLinkPageError },
        { data: productRow, error: productError },
      ] = await Promise.all([
        supabase
          .from("product_pages")
          .select("id", { count: "exact", head: true })
          .eq("product_id", productId)
          .eq("is_target", true)
          .eq("crawl_status", "crawled"),
        supabase
          .from("product_pages")
          .select("id", { count: "exact", head: true })
          .eq("product_id", productId)
          .eq("is_target", true)
          .eq("crawl_status", "crawled")
          .in("page_type", [...BROKEN_LINK_ELIGIBLE_PAGE_TYPES]),
        supabase.from("products").select("competitors").eq("id", productId).maybeSingle(),
      ])

      if (crawledTargetPageError) {
        console.error(
          "[ProspectRealtimeSync] failed to fetch crawled target pages",
          crawledTargetPageError
        )
      } else {
        hasCrawledTargetPage = (crawledTargetPageCount ?? 0) > 0
      }

      if (eligibleBrokenLinkPageError) {
        console.error(
          "[ProspectRealtimeSync] failed to fetch broken-link-eligible pages",
          eligibleBrokenLinkPageError
        )
      } else {
        hasEligibleBrokenLinkPage = (eligibleBrokenLinkPageCount ?? 0) > 0
      }

      if (productError) {
        console.error(
          "[ProspectRealtimeSync] failed to fetch product competitors",
          productError
        )
      } else {
        // Approximates the server's extractCompetitorDomain/isBlockedCompetitorDomain
        // filtering with a simple non-empty check — good enough for gating
        // since erring toward "still required" just waits a bit longer.
        hasUsableCompetitor = ((productRow?.competitors as string[] | null)?.length ?? 0) > 0
      }

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

            if (row.is_target && row.crawl_status === "crawled") {
              let changed = false
              if (!hasCrawledTargetPage) {
                hasCrawledTargetPage = true
                changed = true
              }
              if (
                !hasEligibleBrokenLinkPage &&
                (BROKEN_LINK_ELIGIBLE_PAGE_TYPES as readonly string[]).includes(row.page_type)
              ) {
                hasEligibleBrokenLinkPage = true
                changed = true
              }
              if (changed) syncCompletedRunState()
            }

            usePagesStore.getState().upsertPage({
              id: row.id,
              url: row.url,
              title: row.title,
              description: row.description,
              page_type: row.page_type,
              priority: row.priority,
              relevance_score: row.relevance_score,
              matched_keywords: row.matched_keywords,
              is_target: row.is_target,
              is_manual: row.is_manual,
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
