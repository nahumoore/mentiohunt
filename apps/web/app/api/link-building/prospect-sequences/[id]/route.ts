import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const patchSchema = z
  .object({
    subject: z.string().optional(),
    body: z.string().optional(),
  })
  .refine((data) => data.subject !== undefined || data.body !== undefined, {
    message: "Provide subject and/or body.",
  })

const UNEDITABLE_STATUSES = new Set(["sent", "sending", "bounced"])

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

  const { data: sequence, error: fetchError } = await supabase
    .from("prospect_sequences")
    .select("id, status, prospect_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching prospect sequence:", fetchError)
    return err("Failed to fetch email.", 500)
  }

  if (!sequence) {
    return err("Email not found.", 404)
  }

  const { data: prospect } = await supabase
    .from("backlink_prospects")
    .select("product_id")
    .eq("id", sequence.prospect_id)
    .maybeSingle()

  const productId = prospect?.product_id

  if (!productId) {
    return err("Email not found.", 404)
  }

  const { data: owned } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!owned) {
    return err("Email not found.", 404)
  }

  if (UNEDITABLE_STATUSES.has(sequence.status)) {
    return err("This email has already been sent and can no longer be edited.")
  }

  const updatePayload = {
    ...(parsed.data.subject !== undefined ? { subject: parsed.data.subject } : {}),
    ...(parsed.data.body !== undefined ? { body: parsed.data.body } : {}),
  }

  const { error: updateError } = await supabase
    .from("prospect_sequences")
    .update(updatePayload)
    .eq("id", id)

  if (updateError) {
    console.error("Error updating prospect sequence:", updateError)
    return err("Failed to save email.", 500)
  }

  return NextResponse.json({ id, ...updatePayload })
}
