import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const patchSchema = z.union([
  z.object({
    status: z.enum(["contacted", "negotiating", "won", "dismissed"]),
    email_subject: z.undefined(),
    email_body: z.undefined(),
  }),
  z.object({
    status: z.undefined(),
    email_subject: z.string(),
    email_body: z.string(),
  }),
])

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
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

  const updatePayload =
    parsed.data.status !== undefined
      ? { status: parsed.data.status }
      : { email_subject: parsed.data.email_subject, email_body: parsed.data.email_body }

  const { error: updateError } = await supabase
    .from("backlink_prospects")
    .update(updatePayload)
    .eq("id", id)

  if (updateError) {
    console.error("Error updating prospect status:", updateError)
    return err("Failed to update opportunity.", 500)
  }

  return NextResponse.json({ id, ...updatePayload })
}
