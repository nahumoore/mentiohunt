import { DEFAULT_PROSPECT_TIERS } from "@/lib/opportunity-types"
import { supabaseServer } from "@/lib/supabase/server"
import type { TablesInsert } from "@workspace/supabase/database-types"
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

  const updatedAt = new Date().toISOString()
  const { data: updatedSettings, error: updateError } = await supabase
    .from("backlink_prospects_settings")
    .update({
      voice_tone: voiceTone,
      offering,
      updated_at: updatedAt,
    })
    .eq("product_id", product.id)
    .select("product_id")
    .maybeSingle()

  if (updateError) {
    console.error("Error updating outreach settings:", updateError)
    return buildValidationError("Failed to update outreach settings.", 500)
  }

  if (!updatedSettings) {
    const settingsPayload: TablesInsert<"backlink_prospects_settings"> = {
      product_id: product.id,
      voice_tone: voiceTone,
      offering,
      opportunity_types: DEFAULT_PROSPECT_TIERS,
      updated_at: updatedAt,
    }

    const { error: insertError } = await supabase
      .from("backlink_prospects_settings")
      .insert(settingsPayload)

    if (insertError) {
      console.error("Error creating outreach settings:", insertError)
      return buildValidationError("Failed to update outreach settings.", 500)
    }
  }

  return NextResponse.json({ settings: { voiceTone, offering } })
}
