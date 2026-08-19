"use client"

import { useEffect } from "react"

import { supabaseClient } from "@/lib/supabase/client"
import { useNotificationStore } from "@/stores/notification-store"
import type { Tables } from "@workspace/supabase/database-types"

export function NotificationRealtimeSync({ userId }: { userId: string | null }) {
  useEffect(() => {
    if (!userId) return

    const supabase = supabaseClient()
    const channels: ReturnType<typeof supabase.channel>[] = []
    let cancelled = false

    async function subscribe() {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession()

      if (cancelled) return

      if (error || !session?.access_token) {
        console.error("[NotificationRealtimeSync] missing session for realtime", error)
        return
      }

      supabase.realtime.setAuth(session.access_token)

      const notificationsChannel = supabase
        .channel(`notifications:${userId}`)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as Tables<"notifications">
            if (!row?.id) return
            useNotificationStore.getState().upsertNotification(row)
          }
        )
        .subscribe()

      // Unfiltered — platform updates apply to every user, there's no
      // user_id column to filter on.
      const platformUpdatesChannel = supabase
        .channel("notification_platform_updates")
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notification_platform_updates",
          },
          (payload) => {
            const row = payload.new as Tables<"notification_platform_updates">
            if (!row?.id) return
            useNotificationStore.getState().upsertPlatformUpdate({ ...row, read_at: null })
          }
        )
        .subscribe()

      channels.push(notificationsChannel, platformUpdatesChannel)
    }

    subscribe()

    return () => {
      cancelled = true
      for (const channel of channels) {
        supabase.removeChannel(channel)
      }
    }
  }, [userId])

  return null
}
