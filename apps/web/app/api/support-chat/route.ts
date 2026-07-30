import { NextResponse } from "next/server"

import { getViewerAccountSnapshot } from "@/lib/support-chat/identity"
import type { SupportMessageRow } from "@/lib/support-chat/types"
import { getOrCreateVisitorId } from "@/lib/support-chat/visitor-cookie"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

// Bootstrap for the widget: issues/reads the visitor cookie and returns the
// visitor's most recent conversation (open or closed, so a closed thread's
// history is still visible) plus the server-verified account identity.
// Only called when the launcher is opened or the client sees the
// `mh_support_active` cookie — a cold pageview costs no DB queries.
export async function GET() {
  const visitorId = await getOrCreateVisitorId()

  const [{ data: conversation }, identity] = await Promise.all([
    supabaseAdmin
      .from("support_conversations")
      .select("*")
      .eq("visitor_id", visitorId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    getViewerAccountSnapshot(),
  ])

  let messages: SupportMessageRow[] = []

  if (conversation) {
    const { data } = await supabaseAdmin
      .from("support_messages")
      .select("*")
      .eq("conversation_id", conversation.id)
      .order("created_at", { ascending: true })
    messages = data ?? []
  }

  return NextResponse.json({ conversation, messages, identity })
}
