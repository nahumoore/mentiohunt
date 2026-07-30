import { NextRequest, NextResponse } from "next/server"

import { devOnlyGuard } from "@/lib/support-chat/admin-guard"
import { supabaseAdmin } from "@workspace/supabase/admin"

export const runtime = "nodejs"

// Dev-only console list. Gated by devOnlyGuard() rather than any auth check
// — this route does not exist in production. See admin-guard.ts.
export async function GET(request: NextRequest) {
  const blocked = devOnlyGuard()
  if (blocked) return blocked

  const status = request.nextUrl.searchParams.get("status") ?? "open"

  let query = supabaseAdmin
    .from("support_conversations")
    .select("*")
    .order("last_message_at", { ascending: false, nullsFirst: false })

  if (status !== "all") {
    query = query.eq("status", status)
  }

  const { data: conversations, error } = await query

  if (error) {
    console.error("[support-chat] Failed to list conversations:", error)
    return NextResponse.json({ error: "Failed to load conversations." }, { status: 500 })
  }

  return NextResponse.json({ conversations: conversations ?? [] })
}
