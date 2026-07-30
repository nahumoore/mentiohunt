import { NextRequest, NextResponse } from "next/server"

import { mergeConversationMetadata, toJsonMetadata } from "@/lib/support-chat/metadata"
import { contextSchema } from "@/lib/support-chat/types"
import { readVisitorId } from "@/lib/support-chat/visitor-cookie"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

// Route-change ping so the console shows the page a visitor is currently
// on, and the page trail stays fresh, even between messages. A no-op
// (client-side throttled to >=1/10s) if no conversation exists yet — page
// context for a first-time visitor is captured when they send their first
// message instead.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = contextSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const visitorId = await readVisitorId()
  if (!visitorId) return NextResponse.json({ ok: true })

  const { data: conversation } = await supabaseAdmin
    .from("support_conversations")
    .select("id, metadata")
    .eq("visitor_id", visitorId)
    .eq("status", "open")
    .maybeSingle()

  if (!conversation) return NextResponse.json({ ok: true })

  const metadata = mergeConversationMetadata(
    conversation.metadata ?? {},
    parsed.data,
    request.headers.get("user-agent")
  )

  const { error } = await supabaseAdmin
    .from("support_conversations")
    .update({ current_path: parsed.data.path, metadata: toJsonMetadata(metadata) })
    .eq("id", conversation.id)

  if (error) {
    console.error("[support-chat] Failed to update page context:", error)
  }

  return NextResponse.json({ ok: true })
}
