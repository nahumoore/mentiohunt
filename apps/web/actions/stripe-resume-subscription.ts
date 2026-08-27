"use server"

import Stripe from "stripe"

import { supabaseServer } from "@/lib/supabase/server"
import { getSubscriptionState } from "@/actions/stripe-subscription-state"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/** Undoes a pending cancellation (cancel_at_period_end) before the period
 * actually ends — the subscription keeps running as if it was never
 * canceled. */
export async function stripeResumeSubscription(): Promise<{ error?: string }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const state = await getSubscriptionState()
  if (!state) return { error: "No subscription found." }
  if (!state.cancelAtPeriodEnd) return {}

  try {
    await stripe.subscriptions.update(state.subscriptionId, {
      cancel_at_period_end: false,
    })
  } catch (err) {
    console.error("Stripe resume subscription error:", err)
    return { error: "Could not resume your subscription. Try again." }
  }

  return {}
}
