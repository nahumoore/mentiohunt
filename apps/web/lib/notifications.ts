import { supabaseClient } from "@/lib/supabase/client"

export function markNotificationReadRemote(id: string): void {
  supabaseClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .then(({ error }) => {
      if (error) console.error("[notifications] failed to mark notification read", error)
    })
}

export function markPlatformUpdateReadRemote(userId: string, id: string): void {
  supabaseClient()
    .from("notification_platform_update_reads")
    .upsert({ user_id: userId, platform_update_id: id, read_at: new Date().toISOString() })
    .then(({ error }) => {
      if (error) console.error("[notifications] failed to mark platform update read", error)
    })
}

/**
 * Strips common markdown syntax for the bell popover's line-clamped
 * preview — the full formatting only renders in PlatformUpdateModal, so a
 * compact row showing literal `**`/`#`/`[text](url)` would look broken.
 */
export function stripMarkdown(source: string): string {
  return source
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/^[-*+]\s+/gm, "")
    .replace(/\n+/g, " ")
    .trim()
}
