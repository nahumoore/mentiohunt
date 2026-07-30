import { supabaseAdmin } from "@workspace/supabase/admin"

const WINDOW_MS = 60_000
const WINDOW_MAX = 10
const CONVERSATION_MAX = 200

/**
 * Guards the visitor send endpoint against abuse: at most 10 visitor
 * messages in a rolling 60s window, and a hard cap of 200 visitor messages
 * on one conversation total (past that point it isn't a real support
 * thread, and the founder inbox would just get spammed).
 */
export async function checkSendRateLimit(
  conversationId: string
): Promise<{ allowed: true } | { allowed: false; reason: string }> {
  const since = new Date(Date.now() - WINDOW_MS).toISOString()

  const [recent, total] = await Promise.all([
    supabaseAdmin
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "visitor")
      .gte("created_at", since),
    supabaseAdmin
      .from("support_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .eq("sender", "visitor"),
  ])

  if ((recent.count ?? 0) >= WINDOW_MAX) {
    return { allowed: false, reason: "Too many messages — slow down a little." }
  }
  if ((total.count ?? 0) >= CONVERSATION_MAX) {
    return {
      allowed: false,
      reason: "This conversation has reached its message limit.",
    }
  }
  return { allowed: true }
}
