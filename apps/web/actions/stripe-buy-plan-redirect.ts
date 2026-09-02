"use server"

import Stripe from "stripe"
import { redirect } from "next/navigation"
import { isRedirectError } from "next/dist/client/components/redirect-error"

import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"
import { captureServerEvent } from "@/lib/server-analytics"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function stripeBuyPlanRedirect({
  plan,
  context = "dashboard",
  onboardingProductId,
}: {
  plan: "pro" | "agency"
  /** "onboarding" gets a card-required trial for a completed preview;
   *  "dashboard" keeps today's immediate-charge behavior for
   *  /pricing and the settings billing tab's legacy no-Stripe-customer
   *  cohort (see actions/stripe-switch-plan.ts for everyone else). */
  context?: "onboarding" | "dashboard"
  /** Existing persisted preview product to promote after checkout. */
  onboardingProductId?: string
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const planConfig = PLANS.find((p) => p.key === plan)
  if (!planConfig)
    redirect(
      context === "onboarding"
        ? "/onboarding"
        : "/dashboard/settings?tab=billing"
    )

  const isOnboarding = context === "onboarding"
  const cancelUrl = isOnboarding
    ? `${appUrl}/onboarding/preview`
    : `${appUrl}/dashboard/settings?tab=billing`

  if (isOnboarding && !onboardingProductId) redirect("/onboarding/preview")

  let sessionUrl: string | null = null

  try {
    // Trial is once per account. Anyone who has ever had a Stripe customer
    // has already used theirs.
    let eligibleForTrial = false
    if (isOnboarding) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_customer_id")
        .eq("id", user.id)
        .maybeSingle()

      eligibleForTrial = !profile?.stripe_customer_id

      if (onboardingProductId) {
        const { data: preview } = await supabaseAdmin
          .from("onboarding_previews")
          .select("id")
          .eq("user_id", user.id)
          .eq("product_id", onboardingProductId)
          .in("status", ["ready", "partial"])
          .maybeSingle()
        if (!preview) redirect("/onboarding/preview")
        await supabaseAdmin
          .from("onboarding_previews")
          .update({ checkout_started_at: new Date().toISOString() })
          .eq("id", preview.id)
        void captureServerEvent("onboarding_trial_cta_clicked", user.id, {
          plan,
          product_id: onboardingProductId,
          preview_id: preview.id,
        })
      }
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: user.id,
        ...(isOnboarding
          ? {
              onboarding_product_id: onboardingProductId ?? "",
              onboarding_auto_discover: "1",
            }
          : {}),
      },
      ...(eligibleForTrial && {
        subscription_data: {
          trial_period_days: FREE_TRIAL_DAYS,
          trial_settings: {
            end_behavior: { missing_payment_method: "cancel" },
          },
        },
        // Trial defaults to "if_required", which would let a trialing
        // subscription through with no card on file — require one upfront.
        payment_method_collection: "always",
      }),
      success_url: isOnboarding
        ? `${appUrl}/onboarding/checkout-complete?session_id={CHECKOUT_SESSION_ID}`
        : `${appUrl}/dashboard?upgraded=1&plan=${encodeURIComponent(plan)}`,
      cancel_url: cancelUrl,
    })
    sessionUrl = session.url
    void captureServerEvent("checkout_session_created", user.id, {
      plan,
      context,
      card_required: true,
      product_id: onboardingProductId,
    })
  } catch (err) {
    if (isRedirectError(err)) throw err
    console.error("Stripe checkout error:", err)
  }

  redirect(sessionUrl ?? cancelUrl)
}
