"use server"

import Stripe from "stripe"

import { supabaseServer } from "@/lib/supabase/server"
import { getSubscriptionState } from "@/actions/stripe-subscription-state"
import {
  RETENTION_COUPON_ID,
  RETENTION_DISCOUNT_PERCENT_OFF,
  RETENTION_DISCOUNT_MONTHS,
  SAVE_OFFER_USED_METADATA_KEY,
} from "@/consts/cancellation"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

/** Applies the cancellation-flow retention discount to the caller's
 * subscription — 30% off for 2 months. Creates the underlying Stripe coupon
 * on first use if it doesn't exist yet (fixed id, so this is idempotent and
 * needs no manual Stripe dashboard setup). */
export async function stripeApplyRetentionDiscount(): Promise<{ error?: string }> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return { error: "Not authenticated" }

  const state = await getSubscriptionState()
  if (!state) return { error: "No active subscription found." }
  if (state.saveOfferUsed) {
    return { error: "You've already used your one-time save offer." }
  }

  try {
    await stripe.coupons.retrieve(RETENTION_COUPON_ID)
  } catch {
    try {
      await stripe.coupons.create({
        id: RETENTION_COUPON_ID,
        percent_off: RETENTION_DISCOUNT_PERCENT_OFF,
        duration: "repeating",
        duration_in_months: RETENTION_DISCOUNT_MONTHS,
        name: `${RETENTION_DISCOUNT_PERCENT_OFF}% off for ${RETENTION_DISCOUNT_MONTHS} months`,
      })
    } catch (createErr) {
      console.error("Stripe retention coupon create error:", createErr)
      return { error: "Could not apply the discount. Try again." }
    }
  }

  try {
    await stripe.subscriptions.update(state.subscriptionId, {
      discounts: [{ coupon: RETENTION_COUPON_ID }],
    })
  } catch (err) {
    console.error("Stripe retention discount apply error:", err)
    return { error: "Could not apply the discount. Try again." }
  }

  try {
    await stripe.customers.update(state.customerId, {
      metadata: { [SAVE_OFFER_USED_METADATA_KEY]: new Date().toISOString() },
    })
  } catch (err) {
    // The discount is already applied — don't fail the request over the
    // metadata flag, but log it since it means the once-per-customer guard
    // just silently didn't take for this user.
    console.error("Stripe save-offer metadata write error:", err)
  }

  return {}
}
