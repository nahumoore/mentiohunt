import { onboardingSchema } from "@/consts/onboarding"
import { FREE_TRIAL_MAX_PAGES } from "@/consts/billing"
import { DEFAULT_PROSPECT_TIERS } from "@/lib/opportunity-types"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import type { TablesInsert, TablesUpdate } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

async function runOnboardingJobsOnServer(payload: {
  userId: string
  productId: string
  pageLimit: number
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
    opportunity_types: DEFAULT_PROSPECT_TIERS,
  }

  const { error: upsertSettingsError } = await supabase
    .from("backlink_prospects_settings")
    .upsert(settingsPayload, { onConflict: "product_id" })

  if (upsertSettingsError) {
    console.error("Error saving onboarding settings:", upsertSettingsError)
    return buildValidationError("Failed to complete onboarding.", 500)
  }

  const { resourceUrls, resourceMode } = parsedRequest.data

  if (resourceUrls.length > 0) {
    const { error: deletePagesError } = await supabase
      .from("product_pages")
      .delete()
      .eq("product_id", productId)

    if (deletePagesError) {
      console.error("Error clearing product pages:", deletePagesError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }

    const pageType = resourceMode === "sitemap" ? "sitemap" : "manual"
    const pagesPayload = resourceUrls.map((url) => ({
      product_id: productId,
      url,
      page_type: pageType,
    }))

    const { error: insertPagesError } = await supabase
      .from("product_pages")
      .insert(pagesPayload)

    if (insertPagesError) {
      console.error("Error inserting product pages:", insertPagesError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    onboarding_completed: true,
    ...(parsedRequest.data.userName ? { name: parsedRequest.data.userName } : {}),
    ...(parsedRequest.data.companySize ? { company_size: parsedRequest.data.companySize } : {}),
    ...(parsedRequest.data.role ? { role: parsedRequest.data.role } : {}),
    ...(parsedRequest.data.referralSource
      ? { referral_source: parsedRequest.data.referralSource }
      : {}),
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
      pageLimit: FREE_TRIAL_MAX_PAGES,
    }).catch((error) => {
      console.error("Failed to reach the onboarding server:", error)
    })
  )

  return NextResponse.json({ success: true })
}
