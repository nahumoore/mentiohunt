import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const outreachSettingsSchema = z.object({
  voiceTone: z.string().min(1, "Voice & tone cannot be empty."),
  offering: z.string().min(1, "Offering cannot be empty."),
})

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PUT(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return buildValidationError("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsed = outreachSettingsSchema.safeParse(body)

  if (!parsed.success) {
    return buildValidationError(
      parsed.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const { voiceTone, offering } = parsed.data

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (productError) {
    console.error("Error fetching product for outreach settings:", productError)
    return buildValidationError("Failed to update outreach settings.", 500)
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const { error: upsertError } = await supabase
    .from("backlink_prospects_settings")
    .upsert({
      product_id: product.id,
      voice_tone: voiceTone,
      offering,
      updated_at: new Date().toISOString(),
    })

  if (upsertError) {
    console.error("Error updating outreach settings:", upsertError)
    return buildValidationError("Failed to update outreach settings.", 500)
  }

  return NextResponse.json({ settings: { voiceTone, offering } })
}
