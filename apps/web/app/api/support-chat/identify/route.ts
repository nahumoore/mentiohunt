import { NextRequest, NextResponse } from "next/server"

import { identifySchema } from "@/lib/support-chat/types"
import { readVisitorId } from "@/lib/support-chat/visitor-cookie"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

// Backs the optional post-first-message email capture for anonymous
// visitors. No-ops for logged-in visitors — their email is already known
// server-side and must not be overwritten by client input.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = identifySchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Please enter a valid email.")
  }

  const visitorId = await readVisitorId()
  if (!visitorId) return err("No active conversation.", 404)

  const { data: conversation } = await supabaseAdmin
    .from("support_conversations")
    .select("id, user_id")
    .eq("visitor_id", visitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) return err("No active conversation.", 404)
  if (conversation.user_id) return NextResponse.json({ ok: true })

  const { error } = await supabaseAdmin
    .from("support_conversations")
    .update({ email: parsed.data.email, name: parsed.data.name ?? null })
    .eq("id", conversation.id)

  if (error) {
    console.error("[support-chat] Failed to save visitor email:", error)
    return err("Failed to save email.", 500)
  }

  return NextResponse.json({ ok: true })
}
