import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

/** Approves one held draft (status "awaiting_approval") for a prospect in
 * manual-approval mode, so the sender cron picks it up on its next tick
 * instead of waiting for the user to switch the whole account back to
 * auto-send. Only the earliest held step is approved per call — later steps
 * for the same prospect stay held until their own turn. */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err("Unauthorized", 401)
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("backlink_prospects")
    .select("id, product_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching prospect:", fetchError)
    return err("Failed to fetch opportunity.", 500)
  }

  if (!prospect) {
    return err("Opportunity not found.", 404)
  }

  const { data: owned } = await supabase
    .from("products")
    .select("id")
    .eq("id", prospect.product_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!owned) {
    return err("Opportunity not found.", 404)
  }

  const { data: held, error: heldError } = await supabase
    .from("prospect_sequences")
    .select("id")
    .eq("prospect_id", id)
    .eq("status", "awaiting_approval")
    .order("step", { ascending: true })
    .limit(1)
    .maybeSingle()

  if (heldError) {
    console.error("Error fetching held sequence:", heldError)
    return err("Failed to fetch draft.", 500)
  }

  if (!held) {
    return err("No draft is waiting on your approval for this prospect.", 404)
  }

  const { error: updateError } = await supabase
    .from("prospect_sequences")
    .update({ status: "pending", scheduled_at: new Date().toISOString(), last_error: null })
    .eq("id", held.id)
    .eq("status", "awaiting_approval")

  if (updateError) {
    console.error("Error approving sequence:", updateError)
    return err("Failed to approve the draft.", 500)
  }

  return NextResponse.json({ id, sequenceId: held.id, status: "pending" })
}
