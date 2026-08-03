import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const putSchema = z.object({
  sendFromPrivateInbox: z.boolean(),
})

export async function PUT(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return err("Unauthorized.", 401)

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  if (!isPaid) return err("Email accounts are available on paid plans only.", 403)

  const body = await request.json().catch(() => null)
  const parsed = putSchema.safeParse(body)
  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ send_outreach_from_private_inbox: parsed.data.sendFromPrivateInbox })
    .eq("id", user.id)

  if (updateError) {
    console.error("Failed to update outreach sending preference:", updateError)
    return err("Failed to update preference.", 500)
  }

  return NextResponse.json({ ok: true, sendFromPrivateInbox: parsed.data.sendFromPrivateInbox })
}
