import { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import Stripe from "stripe"

import {
  FREE_TRIAL_DAYS,
  FREE_TRIAL_MAX_PAGES,
  getTierFromPriceId,
} from "@/consts/billing"
import { DEFAULT_DISCOVERY_SETTINGS } from "@/lib/discovery-defaults"
import { DEFAULT_PROSPECT_TIERS } from "@/lib/opportunity-types"
import {
  extractHostname,
  validateDomains,
} from "@/lib/onboarding/validate-domain"
import { startDiscoveryJobs } from "@/lib/onboarding/start-discovery-jobs"
import { activatePreviewProduct } from "@/lib/onboarding/activate-preview-product"
import {
  clearPendingOnboardingData,
  readPendingOnboardingData,
} from "@/lib/onboarding/pending-cookie"
import { supabaseServer } from "@/lib/supabase/server"
import { captureServerEvent } from "@/lib/server-analytics"
import type {
  TablesInsert,
  TablesUpdate,
} from "@workspace/supabase/database-types"

export const runtime = "nodejs"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error("STRIPE_SECRET_KEY not set")
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function toDateString(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString().substring(0, 10)
}

/**
 * Closes the loop on the onboarding paywall's Stripe Checkout synchronously —
 * this runs before the webhook (app/api/payment/route.ts) reliably lands, so
 * the user isn't stuck staring at a redirect while waiting on it. Writes the
 * same profile fields the webhook writes, promotes the already-persisted
 * preview product, and kicks off the activated discovery jobs.
 */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const sessionId = request.nextUrl.searchParams.get("session_id")
  if (!sessionId) redirect("/onboarding")

  const stripe = getStripe()

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })
  } catch (err) {
    console.error("Failed to retrieve checkout session:", err)
    redirect("/onboarding")
  }

  // Prevent replaying someone else's session id.
  if (session.metadata?.supabase_user_id !== user.id) {
    redirect("/onboarding")
  }

  const subscription = session.subscription as Stripe.Subscription | null
  if (
    !subscription ||
    (subscription.status !== "trialing" && subscription.status !== "active")
  ) {
    redirect("/onboarding")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle()

  // Refresh/back-button safe — already ran once for this account.
  if (profile?.onboarding_completed) {
    redirect("/onboarding/welcome")
  }

  const item = subscription.items.data[0]
  const tier = getTierFromPriceId(item?.price?.id ?? "") ?? "pro"

  const pendingData = await readPendingOnboardingData()

  const profileUpdate: TablesUpdate<"profiles"> = {
    tier,
    active_trial: subscription.status === "trialing",
    stripe_customer_id: subscription.customer as string,
    onboarding_completed: true,
    ...(item
      ? {
          billing_period_start_at: toDateString(item.current_period_start),
          billing_period_end_at: toDateString(item.current_period_end),
        }
      : {}),
    ...(pendingData?.userName ? { name: pendingData.userName } : {}),
  }

  const { data: finalizedProfile, error: updateProfileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)
    .eq("onboarding_completed", false)
    .select("id")
    .maybeSingle()

  if (updateProfileError) {
    console.error("Error finalizing onboarding checkout:", updateProfileError)
    redirect("/onboarding")
  }

  // The Stripe webhook may have won the atomic finalization race and already
  // queued activated discovery for this product.
  if (!finalizedProfile) redirect("/onboarding/welcome")

  void captureServerEvent("checkout_completed", user.id, {
    plan: tier,
    trial_days: subscription.status === "trialing" ? FREE_TRIAL_DAYS : 0,
  })
  if (subscription.status === "trialing") {
    void captureServerEvent("trial_started", user.id, {
      plan: tier,
      trial_days: FREE_TRIAL_DAYS,
    })
  }

  let productId: string | null = null

  const previewProductId = session.metadata?.onboarding_product_id?.trim()
  if (previewProductId) {
    const { data: previewProduct } = await supabase
      .from("products")
      .select("id")
      .eq("id", previewProductId)
      .eq("user_id", user.id)
      .maybeSingle()
    productId = previewProduct?.id ?? null
  }

  if (!productId && pendingData) {
    // Domain checks that used to block the wizard before checkout now just
    // filter quietly — payment already went through, so a bad competitor
    // domain shouldn't strand a paying customer outside their own dashboard.
    const websiteHostname = extractHostname(pendingData.websiteUrl)
    const onSiteFiltered = pendingData.competitors.filter((competitor) => {
      const competitorHostname = extractHostname(competitor)
      return (
        competitorHostname !== websiteHostname &&
        !competitorHostname.endsWith(`.${websiteHostname}`)
      )
    })
    const { valid: competitors } = await validateDomains(onSiteFiltered)

    const productPayload: TablesInsert<"products"> = {
      user_id: user.id,
      website_url: pendingData.websiteUrl,
      product_name: pendingData.productName,
      product_description: pendingData.productDescription,
      competitors,
      target_keywords: pendingData.targetKeywords,
    }

    const { data: createdProduct, error: insertProductError } = await supabase
      .from("products")
      .insert(productPayload)
      .select("id")
      .single()

    if (insertProductError || !createdProduct) {
      console.error(
        "Error creating onboarding product after checkout:",
        insertProductError
      )
    } else {
      const newProductId = createdProduct.id
      productId = newProductId

      const settingsPayload: TablesInsert<"backlink_prospects_settings"> = {
        product_id: newProductId,
        opportunity_types: DEFAULT_PROSPECT_TIERS,
        ...DEFAULT_DISCOVERY_SETTINGS,
      }

      const { error: upsertSettingsError } = await supabase
        .from("backlink_prospects_settings")
        .upsert(settingsPayload, { onConflict: "product_id" })

      if (upsertSettingsError) {
        console.error(
          "Error saving onboarding settings after checkout:",
          upsertSettingsError
        )
      }

      if (pendingData.importantPages.length > 0) {
        const pagesPayload: TablesInsert<"product_pages">[] =
          pendingData.importantPages.map((url, index) => ({
            product_id: newProductId,
            url,
            page_type: "manual",
            priority: index + 1,
            is_manual: true,
            is_target: true,
            crawl_status: "pending",
          }))

        const { error: upsertPagesError } = await supabase
          .from("product_pages")
          .upsert(pagesPayload, { onConflict: "product_id,url" })

        if (upsertPagesError) {
          console.error(
            "Error saving onboarding important pages after checkout:",
            upsertPagesError
          )
        }
      }
    }

    await clearPendingOnboardingData()
  }

  if (!productId) {
    // Setup cookie was missing or the DB write above failed — payment is
    // already confirmed (profile is updated above), so don't send a paying
    // customer back through checkout again. Fall back to an existing
    // product if one's already there, otherwise just move them along;
    // there's nothing left to run discovery against.
    const { data: existingProduct } = await supabase
      .from("products")
      .select("id")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle()

    productId = existingProduct?.id ?? null
  }

  if (!productId) {
    console.error("No product available to start discovery for user:", user.id)
    redirect("/onboarding/welcome")
  }

  const autoDiscoverPages =
    pendingData?.autoDiscoverPages ??
    session.metadata?.onboarding_auto_discover === "1"

  if (previewProductId) {
    await activatePreviewProduct({
      userId: user.id,
      productId,
      crawlLimit: FREE_TRIAL_MAX_PAGES,
      autoDiscoverPages,
    }).catch((error) => {
      console.error("Failed to activate preview product:", error)
    })
  } else {
    await startDiscoveryJobs({
      userId: user.id,
      productId,
      crawlLimit: FREE_TRIAL_MAX_PAGES,
      autoDiscoverPages,
    }).catch((error) => {
      console.error("Failed to reach the onboarding server:", error)
    })
  }

  redirect("/onboarding/welcome")
}

export const dynamic = "force-dynamic"
