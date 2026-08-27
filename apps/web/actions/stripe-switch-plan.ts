"use server"

import Stripe from "stripe"

import { PLANS, type BillingTier } from "@/consts/billing"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"
import { getSubscriptionState } from "@/actions/stripe-subscription-state"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/**
 * Swaps the price on an existing subscription instead of starting a new
 * Checkout Session — actions/stripe-buy-plan-redirect.ts would open a
 * *second* subscription for anyone who already has one (every trialing or
 * paid user since onboarding moved behind the paywall). Stripe preserves
 * trial_end across an item price swap, so a trialing user switching plans
 * stays in their trial on the new price with no immediate charge.
 */
export async function stripeSwitchPlan({
  plan,
}: {
  plan: "pro" | "agency"
}): Promise<{ error?: string; tier?: BillingTier }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const planConfig = PLANS.find((p) => p.key === plan)
  if (!planConfig) return { error: "Unknown plan" }

  const state = await getSubscriptionState()
  if (!state) return { error: "No active subscription to switch." }
  if (state.cancelAtPeriodEnd) {
    return { error: "Resume your subscription before switching plans." }
  }
  if (state.planKey === plan) return { tier: planConfig.tier }

  try {
    await stripe.subscriptions.update(state.subscriptionId, {
      items: [{ id: state.itemId, price: planConfig.stripePriceId }],
      proration_behavior: "create_prorations",
      cancel_at_period_end: false,
    })
  } catch (err) {
    console.error("Stripe plan switch error:", err)
    return { error: "Could not switch plans. Try again." }
  }

  // The customer.subscription.updated webhook (app/api/payment/route.ts)
  // will also write this once it lands — set it here too so the UI doesn't
  // wait on webhook latency.
  await supabaseAdmin
    .from("profiles")
    .update({ tier: planConfig.tier })
    .eq("id", user.id)

  return { tier: planConfig.tier }
}
