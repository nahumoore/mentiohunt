"use client"

import { supabaseClient } from "@/lib/supabase/client"
import { useEffect, useMemo, useRef, useState } from "react"

type PgInsert = { new: Record<string, unknown>; old: Record<string, unknown> }
type PgUpdate = { new: Record<string, unknown>; old: Record<string, unknown> }

export type EngineKey = "community" | "directories" | "backlinks" | "media_mentions"
export type EngineStatus = "pending" | "running" | "done" | "failed"

export type DiscoveryStatus = {
  community: EngineStatus
  directories: EngineStatus
  backlinks: EngineStatus
  media_mentions: EngineStatus
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

const ENGINE_KEYS: EngineKey[] = ["community", "directories", "backlinks", "media_mentions"]

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
    validStatus(s.backlinks) &&
    validStatus(s.media_mentions)
  ) {
    return {
      community: s.community,
      directories: s.directories,
      backlinks: s.backlinks,
      media_mentions: s.media_mentions,
      started_at: typeof s.started_at === "string" ? s.started_at : null,
      total: typeof s.total === "number" ? s.total : 4,
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
                subtitle: row.action_type === "email_outreach" ? "Email outreach ready" : "Social mention",
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

  const doneCount = state.status
    ? ENGINE_KEYS.filter((k) => state.status![k] === "done" || state.status![k] === "failed").length
    : 0

  return {
    ...state,
    doneCount,
    isDiscovering: isActive(state.status),
  }
}
