"use server"

import Stripe from "stripe"

import { supabaseServer } from "@/lib/supabase/server"
import { getSubscriptionState } from "@/actions/stripe-subscription-state"
import { EXTEND_TRIAL_DAYS, SAVE_OFFER_USED_METADATA_KEY } from "@/consts/cancellation"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/** The cancellation flow's "no time yet" save offer — pushes a trialing
 * subscription's trial_end out by EXTEND_TRIAL_DAYS. Only makes sense while
 * a trial is actually running (see resolveSaveOffer in
 * consts/cancellation.ts, which falls back to the discount for paid
 * subscribers), and — like the discount — is a one-time offer per
 * customer. */
export async function stripeExtendTrial(): Promise<{ error?: string; trialEnd?: string }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const state = await getSubscriptionState()
  if (!state) return { error: "No active subscription found." }
  if (!state.isTrialing || !state.trialEnd) {
    return { error: "This offer is only available during your trial." }
  }
  if (state.saveOfferUsed) {
    return { error: "You've already used your one-time save offer." }
  }

  const newTrialEndSeconds =
    Math.floor(new Date(state.trialEnd).getTime() / 1000) + EXTEND_TRIAL_DAYS * 24 * 60 * 60

  try {
    await stripe.subscriptions.update(state.subscriptionId, {
      trial_end: newTrialEndSeconds,
      proration_behavior: "none",
    })
  } catch (err) {
    console.error("Stripe trial extension error:", err)
    return { error: "Could not extend your trial. Try again." }
  }

  try {
    await stripe.customers.update(state.customerId, {
      metadata: { [SAVE_OFFER_USED_METADATA_KEY]: new Date().toISOString() },
    })
  } catch (err) {
    // The extension already went through — don't fail the request over the
    // metadata flag, but log it since the once-per-customer guard just
    // silently didn't take for this user.
    console.error("Stripe save-offer metadata write error:", err)
  }

  return { trialEnd: new Date(newTrialEndSeconds * 1000).toISOString() }
}
