import { onboardingSchema, type OpportunityTypeId } from "@/consts/onboarding"
import { OPPORTUNITY_TYPE_TO_PROSPECT_TIER } from "@/lib/opportunity-types"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import type { Json, TablesInsert, TablesUpdate } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function runOnboardingJobsOnServer(payload: {
  userId: string
  productId: string
  replyQueueConfigId: string
}) {
  const serverResponse = await fetch(`${SERVER_URL}/onboarding/complete`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
    },
    body: JSON.stringify(payload),
  })

  if (!serverResponse.ok) {
    const data = await serverResponse
      .json()
      .catch(() => ({ error: "Failed to complete onboarding." }))
    console.error("Failed to run onboarding jobs on server:", data)
  }
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return buildValidationError("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsedRequest = onboardingSchema.safeParse(body)

  if (!parsedRequest.success) {
    return buildValidationError(
      parsedRequest.error.issues[0]?.message ?? "Invalid request payload."
    )
  }

  const productPayload: TablesInsert<"products"> = {
    user_id: user.id,
    website_url: parsedRequest.data.websiteUrl,
    product_name: parsedRequest.data.productName,
    product_description: parsedRequest.data.productDescription,
    competitors: parsedRequest.data.competitors,
  }

  const opportunityTypes = parsedRequest.data.opportunityTypes.map(
    (opportunityType) => OPPORTUNITY_TYPE_TO_PROSPECT_TIER[opportunityType]
  )

  const { data: existingProducts, error: existingProductsError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .limit(2)

  if (existingProductsError) {
    console.error("Error fetching onboarding product:", existingProductsError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  if (existingProducts.length > 1) {
    console.error("Multiple onboarding products found for user:", user.id)
    return buildValidationError("Failed to complete onboarding.", 409)
  }

  let productId: string

  if (existingProducts[0]) {
    productId = existingProducts[0].id
    const productUpdate: TablesUpdate<"products"> = {
      website_url: productPayload.website_url,
      product_name: productPayload.product_name,
      product_description: productPayload.product_description,
      competitors: productPayload.competitors,
    }

    const { error: updateProductError } = await supabase
      .from("products")
      .update(productUpdate)
      .eq("id", productId)

    if (updateProductError) {
      console.error("Error updating onboarding product:", updateProductError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }
  } else {
    const { data: createdProduct, error: insertProductError } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single()

    if (insertProductError || !createdProduct) {
      console.error("Error creating onboarding product:", insertProductError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }

    productId = createdProduct.id
  }

  const settingsPayload: TablesInsert<"backlink_prospects_settings"> = {
    product_id: productId,
    opportunity_types: opportunityTypes,
  }

  const { error: upsertSettingsError } = await supabase
    .from("backlink_prospects_settings")
    .upsert(settingsPayload)

  if (upsertSettingsError) {
    console.error("Error saving onboarding settings:", upsertSettingsError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  const replyQueuePayload: TablesInsert<"reply_queue_configs"> = {
    user_id: user.id,
    product_id: productId,
    platforms: parsedRequest.data.monitoringPlatforms,
    communities: parsedRequest.data.monitoringCommunities as unknown as Json,
    keywords: parsedRequest.data.monitoringKeywords,
    email_alerts_enabled: parsedRequest.data.emailAlertsEnabled,
    custom_voice_instructions: null,
    status: "active",
  }

  const { data: existingReplyQueueConfig, error: existingConfigError } =
    await supabase
      .from("reply_queue_configs")
      .select("id")
      .eq("product_id", productId)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

  if (existingConfigError) {
    console.error(
      "Error fetching onboarding reply queue settings:",
      existingConfigError
    )
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  const saveReplyQueueConfig = existingReplyQueueConfig
    ? supabase
        .from("reply_queue_configs")
        .update(replyQueuePayload)
        .eq("id", existingReplyQueueConfig.id)
        .select("id")
        .single()
    : supabase
        .from("reply_queue_configs")
        .insert(replyQueuePayload)
        .select("id")
        .single()

  const { data: replyQueueConfig, error: saveConfigError } =
    await saveReplyQueueConfig

  if (saveConfigError || !replyQueueConfig) {
    console.error("Error saving onboarding reply queue settings:", saveConfigError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    onboarding_completed: true,
    ...(parsedRequest.data.userName ? { name: parsedRequest.data.userName } : {}),
    ...(parsedRequest.data.companySize ? { company_size: parsedRequest.data.companySize } : {}),
    ...(parsedRequest.data.role ? { role: parsedRequest.data.role } : {}),
    ...(parsedRequest.data.referralSource
      ? { referral_source: parsedRequest.data.referralSource }
      : {}),
    ...(parsedRequest.data.primaryUse ? { primary_use: parsedRequest.data.primaryUse } : {}),
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)

  if (updateProfileError) {
    console.error("Error marking onboarding complete:", updateProfileError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  waitUntil(
    runOnboardingJobsOnServer({
      userId: user.id,
      productId,
      replyQueueConfigId: replyQueueConfig.id,
    }).catch((error) => {
      console.error("Failed to reach the onboarding server:", error)
    })
  )

  return NextResponse.json({ success: true })
}
