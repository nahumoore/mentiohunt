import {
  OPPORTUNITY_TYPE_TO_PROSPECT_TIER,
  TYPE_CONFIG,
  type OpportunityType,
} from "@/lib/opportunity-types"
import { DEFAULT_DISCOVERY_SETTINGS } from "@/lib/discovery-defaults"
import { supabaseServer } from "@/lib/supabase/server"
import type { TablesInsert } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const discoveryOpportunityTypes = [
  ...(Object.keys(TYPE_CONFIG) as OpportunityType[]),
] as [OpportunityType, ...OpportunityType[]]

const discoverySettingsSchema = z.object({
  opportunityTypes: z
    .array(z.enum(discoveryOpportunityTypes))
    .min(1, "Choose at least one backlink type."),
  drMin: z.number().int().min(0).max(100),
  drMax: z.number().int().min(0).max(100).nullable(),
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
    .select("id, competitors")
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

  let configurationWarning: string | undefined
  if (
    opportunityTypes.length === 1 &&
    opportunityTypes[0] === "broken_link_buildings"
  ) {
    const competitors = (product.competitors as string[] | null) ?? []
    if (competitors.length === 0) {
      configurationWarning =
        "Settings saved, but broken link discovery needs at least one competitor before it can run."
    } else {
      const { count: eligiblePageCount, error: pageCountError } = await supabase
        .from("product_pages")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("crawl_status", "crawled")
        .eq("is_target", true)
        .in("page_type", ["article", "resource", "free_tool", "manual"])

      if (!pageCountError && (eligiblePageCount ?? 0) === 0) {
        configurationWarning =
          "Settings saved, but broken link discovery needs at least one crawled target page before it can run."
      }
    }
  }

  const settingsPayload: TablesInsert<"backlink_prospects_settings"> = {
    product_id: product.id,
    opportunity_types: opportunityTypes.map(
      (opportunityType) => OPPORTUNITY_TYPE_TO_PROSPECT_TIER[opportunityType]
    ),
    dr_min: drMin,
    dr_max: drMax,
    ...DEFAULT_DISCOVERY_SETTINGS,
    updated_at: new Date().toISOString(),
  }

  const { data: updatedSettings, error: updateSettingsError } = await supabase
    .from("backlink_prospects_settings")
    .update({
      opportunity_types: settingsPayload.opportunity_types,
      dr_min: drMin,
      dr_max: drMax,
      updated_at: settingsPayload.updated_at,
    })
    .eq("product_id", product.id)
    .select("product_id")
    .maybeSingle()

  if (updateSettingsError) {
    console.error("Error updating discovery settings:", updateSettingsError)
    return buildValidationError("Failed to update discovery settings.", 500)
  }

  if (!updatedSettings) {
    const { error: insertSettingsError } = await supabase
      .from("backlink_prospects_settings")
      .insert(settingsPayload)

    if (insertSettingsError) {
      console.error("Error creating discovery settings:", insertSettingsError)
      return buildValidationError("Failed to update discovery settings.", 500)
    }
  }

  return NextResponse.json({
    settings: {
      opportunityTypes,
      drMin,
      drMax,
    },
    configurationWarning,
  })
}
