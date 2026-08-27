"use server"

import Stripe from "stripe"

import { getTierFromPriceId, type BillingTier } from "@/consts/billing"
import { SAVE_OFFER_USED_METADATA_KEY } from "@/consts/cancellation"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export type SubscriptionState = {
  status: Stripe.Subscription.Status
  planKey: "pro" | "agency" | null
  tier: BillingTier | null
  subscriptionId: string
  customerId: string
  itemId: string
  currentPeriodEnd: string
  trialEnd: string | null
  cancelAtPeriodEnd: boolean
  isTrialing: boolean
  /** Whether this customer has already taken a cancellation save offer
   * (discount or trial extension) — a customer gets one, ever. */
  saveOfferUsed: boolean
  /** The active discount on this subscription, if any — surfaced in the
   * billing tab so taking the retention discount leaves a visible trace. */
  discount: { percentOff: number; endsAt: string | null } | null
}

/**
 * Reads the live Stripe subscription for the signed-in user — nothing about
 * cancel_at_period_end or the subscription id is stored in `profiles`, so
 * this is the only source of truth for it. Returns null when the account has
 * no Stripe customer at all: the legacy no-card free trial cohort created by
 * app/api/auth/_handle-new-user.ts, which still uses the checkout flow
 * instead of this subscription-management one.
 */
export async function getSubscriptionState(): Promise<SubscriptionState | null> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .maybeSingle()

  const stripeCustomerId = profile?.stripe_customer_id
  if (!stripeCustomerId) return null

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    status: "all",
    limit: 5,
    expand: ["data.customer", "data.discounts.source.coupon"],
  })

  const subscription = subscriptions.data.find(
    (sub) => sub.status !== "canceled" && sub.status !== "incomplete_expired"
  )
  if (!subscription) return null

  const item = subscription.items.data[0]
  if (!item) return null

  const tier = getTierFromPriceId(item.price?.id ?? "")

  const customer = subscription.customer
  const saveOfferUsed =
    typeof customer !== "string" && !customer.deleted
      ? Boolean(customer.metadata?.[SAVE_OFFER_USED_METADATA_KEY])
      : false

  const discountObj = subscription.discounts[0]
  const discount =
    discountObj && typeof discountObj !== "string" && discountObj.source.type === "coupon"
      ? (() => {
          const coupon = discountObj.source.coupon
          if (!coupon || typeof coupon === "string" || coupon.percent_off == null) return null
          return {
            percentOff: coupon.percent_off,
            endsAt: discountObj.end ? new Date(discountObj.end * 1000).toISOString() : null,
          }
        })()
      : null

  return {
    status: subscription.status,
    planKey: tier === "pro" || tier === "agency" ? tier : null,
    tier,
    subscriptionId: subscription.id,
    customerId: stripeCustomerId,
    itemId: item.id,
    currentPeriodEnd: new Date(item.current_period_end * 1000).toISOString(),
    trialEnd: subscription.trial_end
      ? new Date(subscription.trial_end * 1000).toISOString()
      : null,
    cancelAtPeriodEnd: subscription.cancel_at_period_end,
    isTrialing: subscription.status === "trialing",
    saveOfferUsed,
    discount,
  }
}
