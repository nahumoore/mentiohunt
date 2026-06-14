"use client"

import { supabaseClient } from "@/lib/supabase/client"
import { useEffect, useMemo, useRef, useState } from "react"

type PgInsert = { new: Record<string, unknown>; old: Record<string, unknown> }
type PgUpdate = { new: Record<string, unknown>; old: Record<string, unknown> }

export type EngineKey = "community" | "directories" | "backlinks"
export type EngineStatus = "pending" | "running" | "done" | "failed"

export type DiscoveryStatus = {
  community: EngineStatus
  directories: EngineStatus
  backlinks: EngineStatus
  started_at: string | null
  total: number
}

export type DiscoveryItemType = "backlink" | "directory" | "community"

export type DiscoveryItem = {
  id: string
  type: DiscoveryItemType
  title: string
  subtitle: string | null
  timestamp: string
}

type HookState = {
  status: DiscoveryStatus | null
  items: DiscoveryItem[]
}

const ENGINE_KEYS: EngineKey[] = ["community", "directories", "backlinks"]

function isActive(status: DiscoveryStatus | null): boolean {
  if (!status) return false
  return ENGINE_KEYS.some((k) => status[k] === "running" || status[k] === "pending")
}

function parseStatus(raw: unknown): DiscoveryStatus | null {
  if (!raw || typeof raw !== "object") return null
  const s = raw as Record<string, unknown>
  const validStatus = (v: unknown): v is EngineStatus =>
    v === "pending" || v === "running" || v === "done" || v === "failed"
  if (
    validStatus(s.community) &&
    validStatus(s.directories) &&
    validStatus(s.backlinks)
  ) {
    return {
      community: s.community,
      directories: s.directories,
      backlinks: s.backlinks,
      started_at: typeof s.started_at === "string" ? s.started_at : null,
      total: typeof s.total === "number" ? s.total : 3,
    }
  }
  return null
}

export function useDiscoveryProgress(
  productId: string | null | undefined,
  userId: string | null | undefined,
  initialStatus: DiscoveryStatus | null = null
): HookState & { doneCount: number; isDiscovering: boolean } {
  const [state, setState] = useState<HookState>({
    status: initialStatus,
    items: [],
  })
  const supabase = useMemo(() => supabaseClient(), [])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)

  useEffect(() => {
    if (!productId || !userId) return

    async function bootstrap() {
      if (initialStatus && isActive(initialStatus)) return

      const { data } = await supabase
        .from("backlink_prospects_settings")
        .select("discovery_status")
        .eq("product_id", productId!)
        .maybeSingle()

      const parsed = parseStatus(data?.discovery_status)
      if (parsed) {
        setState((prev) => ({ ...prev, status: parsed }))
      }
    }

    bootstrap()

    const channel = supabase
      .channel(`discovery:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "backlink_prospects_settings",
          filter: `product_id=eq.${productId}`,
        },
        (payload: PgUpdate) => {
          const parsed = parseStatus(payload.new.discovery_status)
          if (parsed) {
            setState((prev) => ({ ...prev, status: parsed }))
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "backlink_prospects",
          filter: `product_id=eq.${productId}`,
        },
        (payload: PgInsert) => {
          const row = payload.new
          setState((prev) => ({
            ...prev,
            items: [
              {
                id: String(row.id),
                type: "backlink" as DiscoveryItemType,
                title: (row.domain as string | null) ?? "New prospect",
                subtitle: "Email outreach ready",
                timestamp: (row.discovered_at as string) ?? new Date().toISOString(),
              },
              ...prev.items,
            ].slice(0, 20),
          }))
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "directory_submissions",
          filter: `product_id=eq.${productId}`,
        },
        (payload: PgInsert) => {
          const row = payload.new
          setState((prev) => ({
            ...prev,
            items: [
              {
                id: String(row.id),
                type: "directory" as DiscoveryItemType,
                title: (row.domain as string | null) ?? "New directory",
                subtitle: "Directory opportunity",
                timestamp: (row.discovered_at as string) ?? new Date().toISOString(),
              },
              ...prev.items,
            ].slice(0, 20),
          }))
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "reply_queue_items",
          filter: `user_id=eq.${userId}`,
        },
        (payload: PgInsert) => {
          const row = payload.new
          setState((prev) => ({
            ...prev,
            items: [
              {
                id: String(row.id),
                type: "community" as DiscoveryItemType,
                title: (row.title as string | null) ?? (row.community as string | null) ?? "New mention",
                subtitle: row.community ? `r/${row.community as string}` : null,
                timestamp: (row.created_at as string) ?? new Date().toISOString(),
              },
              ...prev.items,
            ].slice(0, 20),
          }))
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      channel.unsubscribe()
      channelRef.current = null
    }
  }, [productId, userId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Polling fallback: realtime UPDATE events on backlink_prospects_settings
  // require the supabase_realtime publication to include the table, which is
  // not guaranteed. Poll discovery_status while any engine is still active so
  // engine progress (and auto-dismiss) works regardless of realtime config.
  useEffect(() => {
    if (!productId) return
    if (!isActive(state.status)) return

    const interval = setInterval(async () => {
      const { data } = await supabase
        .from("backlink_prospects_settings")
        .select("discovery_status")
        .eq("product_id", productId)
        .maybeSingle()

      const parsed = parseStatus(data?.discovery_status)
      if (parsed) {
        setState((prev) => ({ ...prev, status: parsed }))
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [productId, state.status, supabase])

  const doneCount = state.status
    ? ENGINE_KEYS.filter((k) => state.status![k] === "done" || state.status![k] === "failed").length
    : 0

  return {
    ...state,
    doneCount,
    isDiscovering: isActive(state.status),
  }
}
