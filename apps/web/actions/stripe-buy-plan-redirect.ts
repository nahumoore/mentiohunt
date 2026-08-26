"use server"

import Stripe from "stripe"
import { redirect } from "next/navigation"

import { FREE_TRIAL_DAYS, PLANS } from "@/consts/billing"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function stripeBuyPlanRedirect({
  plan,
  context = "dashboard",
  autoDiscoverPages,
}: {
  plan: "pro" | "agency"
  /** "onboarding" gets a card-required trial and routes back into the wizard
   *  to finish setup; "dashboard" keeps today's immediate-charge behavior for
   *  /pricing and /dashboard/billing. */
  context?: "onboarding" | "dashboard"
  /** Only meaningful for context "onboarding" — carried through Stripe
   *  metadata since /onboarding/checkout-complete needs it to kick off the
   *  discovery jobs the same way /api/onboarding/complete does. */
  autoDiscoverPages?: boolean
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const planConfig = PLANS.find((p) => p.key === plan)
  if (!planConfig) redirect(context === "onboarding" ? "/onboarding" : "/dashboard/billing")

  const isOnboarding = context === "onboarding"
  const cancelUrl = isOnboarding ? `${appUrl}/onboarding` : `${appUrl}/dashboard/billing`

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
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: {
        supabase_user_id: user.id,
        ...(isOnboarding
          ? { onboarding_auto_discover: autoDiscoverPages ? "1" : "0" }
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
  } catch (err) {
    console.error("Stripe checkout error:", err)
  }

  redirect(sessionUrl ?? cancelUrl)
}
