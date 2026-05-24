import { OPPORTUNITY_TYPE_IDS, type OpportunityTypeId } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"
import type {
  Database,
  TablesInsert,
} from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const discoveryOpportunityTypes = [
  ...OPPORTUNITY_TYPE_IDS,
] as [OpportunityTypeId, ...OpportunityTypeId[]]

const discoverySettingsSchema = z.object({
  opportunityTypes: z
    .array(z.enum(discoveryOpportunityTypes))
    .min(1, "Choose at least one backlink type."),
  drMin: z.number().int().min(0).max(100),
  drMax: z.number().int().min(0).max(100).nullable(),
})

const opportunityTypeToProspectTier = {
  competitor_backlinks: "competitor_backlink",
  unlinked_mentions: "unlinked_mention",
  media_mentions: "media_mention",
} satisfies Record<
  OpportunityTypeId,
  Database["public"]["Enums"]["prospect_tier"]
>

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
  const parsedRequest = discoverySettingsSchema.safeParse(body)

  if (!parsedRequest.success) {
    return buildValidationError(
      parsedRequest.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const { opportunityTypes, drMin, drMax } = parsedRequest.data

  if (drMax !== null && drMax < drMin) {
    return buildValidationError("Maximum DR must be at least minimum DR.")
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (productError) {
    console.error("Error fetching discovery settings product:", productError)
    return buildValidationError("Failed to update discovery settings.", 500)
  }

  if (!product) {
    return buildValidationError("Product not found.", 404)
  }

  const settingsPayload: TablesInsert<"product_backlink_discovery_settings"> = {
    product_id: product.id,
    opportunity_types: opportunityTypes.map(
      (opportunityType) => opportunityTypeToProspectTier[opportunityType]
    ),
    dr_min: drMin,
    dr_max: drMax,
    updated_at: new Date().toISOString(),
  }

  const { error: upsertSettingsError } = await supabase
    .from("product_backlink_discovery_settings")
    .upsert(settingsPayload)

  if (upsertSettingsError) {
    console.error("Error updating discovery settings:", upsertSettingsError)
    return buildValidationError("Failed to update discovery settings.", 500)
  }

  return NextResponse.json({
    settings: {
      opportunityTypes,
      drMin,
      drMax,
    },
  })
}
