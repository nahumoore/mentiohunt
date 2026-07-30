import { waitUntil } from "@vercel/functions"
import { NextRequest, NextResponse } from "next/server"

import { getViewerAccountSnapshot } from "@/lib/support-chat/identity"
import { mergeConversationMetadata, toJsonMetadata } from "@/lib/support-chat/metadata"
import { notifyNewVisitorMessage } from "@/lib/support-chat/notify"
import { checkSendRateLimit } from "@/lib/support-chat/rate-limit"
import { sendMessageSchema } from "@/lib/support-chat/types"
import {
  getOrCreateVisitorId,
  markThreadActive,
  readVisitorId,
} from "@/lib/support-chat/visitor-cookie"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null)
  const parsed = sendMessageSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const visitorId = await getOrCreateVisitorId()
  const identity = await getViewerAccountSnapshot()
  const userAgent = request.headers.get("user-agent")

  const { data: existing } = await supabaseAdmin
    .from("support_conversations")
    .select("*")
    .eq("visitor_id", visitorId)
    .eq("status", "open")
    .maybeSingle()

  if (existing) {
    const rateCheck = await checkSendRateLimit(existing.id)
    if (!rateCheck.allowed) return err(rateCheck.reason, 429)
  }

  const metadata = mergeConversationMetadata(
    existing?.metadata ?? {},
    parsed.data.context ?? {},
    userAgent
  )
  metadata.account = identity

  const currentPath = parsed.data.context?.path ?? existing?.current_path ?? null
  const nowIso = new Date().toISOString()

  let conversation = existing

  if (!conversation) {
    const { data: created, error: createError } = await supabaseAdmin
      .from("support_conversations")
      .insert({
        visitor_id: visitorId,
        user_id: identity?.user_id ?? null,
        email: identity?.email ?? null,
        name: identity?.name ?? null,
        current_path: currentPath,
        metadata: toJsonMetadata(metadata),
        last_message_at: nowIso,
        last_visitor_message_at: nowIso,
      })
      .select("*")
      .single()

    if (createError || !created) {
      console.error("[support-chat] Failed to create conversation:", createError)
      return err("Failed to send message.", 500)
    }
    conversation = created
  } else {
    const { data: updated, error: updateError } = await supabaseAdmin
      .from("support_conversations")
      .update({
        current_path: currentPath,
        metadata: toJsonMetadata(metadata),
        last_message_at: nowIso,
        last_visitor_message_at: nowIso,
        user_id: conversation.user_id ?? identity?.user_id ?? null,
        email: conversation.email ?? identity?.email ?? null,
        name: conversation.name ?? identity?.name ?? null,
      })
      .eq("id", conversation.id)
      .select("*")
      .single()

    if (updateError || !updated) {
      console.error("[support-chat] Failed to update conversation:", updateError)
      return err("Failed to send message.", 500)
    }
    conversation = updated
  }

  const { data: message, error: messageError } = await supabaseAdmin
    .from("support_messages")
    .insert({
      conversation_id: conversation.id,
      sender: "visitor",
      body: parsed.data.body,
      page_url: currentPath,
    })
    .select("*")
    .single()

  if (messageError || !message) {
    console.error("[support-chat] Failed to insert message:", messageError)
    return err("Failed to send message.", 500)
  }

  await markThreadActive()
  waitUntil(notifyNewVisitorMessage(conversation, message))

  return NextResponse.json({ conversation, message }, { status: 201 })
}

// Polling endpoint for the widget: returns the visitor's most recent
// conversation plus any messages after `since`, so the panel picks up the
// founder's replies (and status changes) without Supabase realtime, which
// would otherwise require permissive RLS for anonymous visitors.
export async function GET(request: NextRequest) {
  const visitorId = await readVisitorId()
  if (!visitorId) {
    return NextResponse.json({ conversation: null, messages: [] })
  }

  const since = request.nextUrl.searchParams.get("since")

  const { data: conversation } = await supabaseAdmin
    .from("support_conversations")
    .select("*")
    .eq("visitor_id", visitorId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!conversation) {
    return NextResponse.json({ conversation: null, messages: [] })
  }

  let query = supabaseAdmin
    .from("support_messages")
    .select("*")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true })

  if (since) query = query.gt("created_at", since)

  const { data: messages } = await query

  return NextResponse.json({ conversation, messages: messages ?? [] })
}
