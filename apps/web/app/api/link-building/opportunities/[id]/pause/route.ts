import { NextResponse } from "next/server"

import { supabaseServer } from "@/lib/supabase/server"

export const runtime = "nodejs"

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

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

  const { error: prospectError } = await supabase
    .from("backlink_prospects")
    .update({ status: "dismissed" })
    .eq("id", id)

  if (prospectError) {
    console.error("Error dismissing prospect:", prospectError)
    return err("Failed to pause sequence.", 500)
  }

  const { error: seqError } = await supabase
    .from("prospect_sequences")
    .update({ status: "paused" })
    .eq("prospect_id", id)
    .in("status", ["pending"])

  if (seqError) {
    console.error("Error pausing sequences:", seqError)
    return err("Failed to pause email sequence.", 500)
  }

  return NextResponse.json({ id, status: "dismissed" })
}
