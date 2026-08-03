import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const putSchema = z.object({
  accountId: z.string().uuid("Invalid account id."),
  sendAutomatedOutreach: z.boolean(),
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

  const { accountId, sendAutomatedOutreach } = parsed.data

  const { data: updated, error: updateError } = await supabase
    .from("email_accounts")
    .update({ send_automated_outreach: sendAutomatedOutreach })
    .eq("id", accountId)
    .eq("user_id", user.id)
    .eq("is_public", false)
    .select("id")
    .maybeSingle()

  if (updateError) {
    console.error("Failed to update outreach sending preference:", updateError)
    return err("Failed to update preference.", 500)
  }

  if (!updated) return err("Email account not found.", 404)

  return NextResponse.json({ ok: true, sendAutomatedOutreach })
}
