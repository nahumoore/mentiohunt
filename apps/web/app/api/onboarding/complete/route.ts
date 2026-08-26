import { onboardingSchema, validateImportantPages } from "@/consts/onboarding"
import { FREE_TRIAL_MAX_PAGES } from "@/consts/billing"
import { DEFAULT_PROSPECT_TIERS } from "@/lib/opportunity-types"
import { extractHostname, validateDomains } from "@/lib/onboarding/validate-domain"
import { startDiscoveryJobs } from "@/lib/onboarding/start-discovery-jobs"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import type { TablesInsert, TablesUpdate } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"

export const runtime = "nodejs"

function buildValidationError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
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

  const startOutreach =
    typeof body === "object" && body !== null && "startOutreach" in body
      ? Boolean((body as { startOutreach?: unknown }).startOutreach)
      : false

  // A card is always required to finish onboarding — the wizard's paywall
  // screen is the only path that completes it, via
  // app/onboarding/checkout-complete/route.ts after a real Stripe checkout.
  // This route only ever persists setup; reject any client trying to skip
  // straight to onboarding_completed/discovery.
  if (startOutreach) {
    return buildValidationError(
      "Add a payment method to finish onboarding and unlock your dashboard.",
      402
    )
  }

  // Cross-field rule (pages present OR auto-discover checked) can't live in
  // onboardingSchema itself — see the comment on importantPagesStepSchema in
  // consts/onboarding.ts — so it's only enforced client-side by the wizard's
  // validateStep. Re-check it here so a request bypassing the UI can't create
  // a product with zero target pages and no auto-discovery.
  const importantPagesError = validateImportantPages({
    importantPages: parsedRequest.data.importantPages,
    autoDiscoverPages: parsedRequest.data.autoDiscoverPages,
    websiteUrl: parsedRequest.data.websiteUrl,
  })
  if (importantPagesError) {
    return buildValidationError(importantPagesError)
  }

  const websiteHostname = extractHostname(parsedRequest.data.websiteUrl)
  const ownSiteCompetitor = parsedRequest.data.competitors.find(
    (competitor) => {
      const competitorHostname = extractHostname(competitor)
      return competitorHostname === websiteHostname || competitorHostname.endsWith(`.${websiteHostname}`)
    }
  )
  if (ownSiteCompetitor) {
    return buildValidationError("A competitor must be different from your own website.")
  }

  const { invalid: invalidCompetitors } = await validateDomains(parsedRequest.data.competitors)
  if (invalidCompetitors.length > 0) {
    return buildValidationError("Each competitor must be a live domain that resolves on the internet.")
  }

  const productPayload: TablesInsert<"products"> = {
    user_id: user.id,
    website_url: parsedRequest.data.websiteUrl,
    product_name: parsedRequest.data.productName,
    product_description: parsedRequest.data.productDescription,
    competitors: parsedRequest.data.competitors,
    target_keywords: parsedRequest.data.targetKeywords,
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
      target_keywords: productPayload.target_keywords,
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

  if (parsedRequest.data.importantPages.length > 0) {
    // Array order is the priority the user dragged into the onboarding step —
    // index 0 = priority 1 (highest), same convention as target_keywords.
    const pagesPayload: TablesInsert<"product_pages">[] = parsedRequest.data.importantPages.map(
      (url, index) => ({
        product_id: productId,
        url,
        page_type: "manual",
        priority: index + 1,
        is_manual: true,
        is_target: true,
        crawl_status: "pending",
      })
    )

    const { error: upsertPagesError } = await supabase
      .from("product_pages")
      .upsert(pagesPayload, { onConflict: "product_id,url" })

    if (upsertPagesError) {
      console.error("Error saving onboarding important pages:", upsertPagesError)
      return buildValidationError("Failed to complete onboarding.", 500)
    }
  }

  const profileUpdate: TablesUpdate<"profiles"> = {
    ...(startOutreach ? { onboarding_completed: true } : {}),
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

  if (startOutreach) {
    waitUntil(
      startDiscoveryJobs({
        userId: user.id,
        productId,
        crawlLimit: FREE_TRIAL_MAX_PAGES,
        autoDiscoverPages: parsedRequest.data.autoDiscoverPages,
      }).catch((error) => {
        console.error("Failed to reach the onboarding server:", error)
      })
    )
  }

  return NextResponse.json({ success: true, productId })
}
