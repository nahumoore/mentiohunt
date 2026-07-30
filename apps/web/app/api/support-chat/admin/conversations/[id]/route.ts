import { NextRequest, NextResponse } from "next/server"

import { devOnlyGuard } from "@/lib/support-chat/admin-guard"
import { adminPatchSchema, adminReplySchema } from "@/lib/support-chat/types"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  const { id } = await params

  const [{ data: conversation, error: conversationError }, { data: messages }] =
    await Promise.all([
      supabaseAdmin.from("support_conversations").select("*").eq("id", id).maybeSingle(),
      supabaseAdmin
        .from("support_messages")
        .select("*")
        .eq("conversation_id", id)
        .order("created_at", { ascending: true }),
    ])

  if (conversationError || !conversation) {
    return err("Conversation not found.", 404)
  }

  return NextResponse.json({ conversation, messages: messages ?? [] })
}

// Agent reply from the /support console.
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = adminReplySchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid reply.")
  }

  const { data: conversation } = await supabaseAdmin
    .from("support_conversations")
    .select("id")
    .eq("id", id)
    .maybeSingle()

  if (!conversation) return err("Conversation not found.", 404)

  const nowIso = new Date().toISOString()

  const { data: message, error: messageError } = await supabaseAdmin
    .from("support_messages")
    .insert({ conversation_id: id, sender: "agent", body: parsed.data.body })
    .select("*")
    .single()

  if (messageError || !message) {
    console.error("[support-chat] Failed to insert agent reply:", messageError)
    return err("Failed to send reply.", 500)
  }

  await supabaseAdmin
    .from("support_conversations")
    .update({
      last_message_at: nowIso,
      last_agent_message_at: nowIso,
      agent_read_at: nowIso,
    })
    .eq("id", id)

  return NextResponse.json({ message }, { status: 201 })
}

// Close/reopen a conversation, or mark it read.
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = adminPatchSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request.")
  }

  const update =
    "markRead" in parsed.data
      ? { agent_read_at: new Date().toISOString() }
      : { status: parsed.data.status }

  const { data: conversation, error } = await supabaseAdmin
    .from("support_conversations")
    .update(update)
    .eq("id", id)
    .select("*")
    .maybeSingle()

  if (error || !conversation) {
    console.error("[support-chat] Failed to update conversation:", error)
    return err("Failed to update conversation.", 500)
  }

  return NextResponse.json({ conversation })
}
