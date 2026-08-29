import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { supabaseAdmin } from "@workspace/supabase/admin"
import { getTierFromPriceId } from "@/consts/billing"
import type { BillingTier } from "@/consts/billing"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set")
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function getWebhookSecret() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) throw new Error("STRIPE_WEBHOOK_SECRET not set")
  return process.env.STRIPE_WEBHOOK_SECRET
}

function toDateString(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString().substring(0, 10)
}

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

async function notifyBillingChange(payload: {
  userId: string
  type: "subscription_created" | "subscription_updated" | "subscription_deleted" | "payment_failed"
  tier: BillingTier
}) {
  try {
    const res = await fetch(`${SERVER_URL}/billing/notification`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "unknown error" }))
      console.error("Failed to send billing notification:", data)
    }
  } catch (err) {
    console.error("Failed to reach server for billing notification:", err)
  }
}

export async function POST(req: NextRequest) {
  const stripe = getStripe()
  const webhookSecret = getWebhookSecret()

  const body = await req.text()
  const headersList = await headers()
  const signature = headersList.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    console.error("Webhook signature verification failed:", err)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  try {
    switch (event.type) {
      case "customer.subscription.created": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find user by stripe_customer_id, fall back to email match
        let { data: profile } = await supabaseAdmin
          .from("profiles")
          .select("id, stripe_customer_id")
          .eq("stripe_customer_id", customerId)
          .maybeSingle()

        if (!profile) {
          const customer = await stripe.customers.retrieve(customerId)
          if (customer.deleted) break

          const email = (customer as Stripe.Customer).email
          if (!email) break

          const { data: profileByEmail } = await supabaseAdmin
            .from("profiles")
            .select("id, stripe_customer_id")
            .eq("email", email)
            .maybeSingle()

          profile = profileByEmail
        }

        if (!profile) break

        const item = subscription.items.data[0]
        if (!item) break
        const tier = getTierFromPriceId(item.price?.id ?? "")
        if (!tier) break

        await supabaseAdmin
          .from("profiles")
          .update({
            tier,
            active_trial: subscription.status === "trialing",
            stripe_customer_id: customerId,
            billing_period_start_at: toDateString(item.current_period_start),
            billing_period_end_at: toDateString(item.current_period_end),
          })
          .eq("id", profile.id)

        await notifyBillingChange({
          userId: profile.id,
          type: "subscription_created",
          tier,
        })

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const item = subscription.items.data[0]
        if (!item) break
        // "trialing" is entitled the same as "active" — a card-required
        // trial subscription (see actions/stripe-buy-plan-redirect.ts) sits
        // in "trialing" for its first 7 days, and reading only "active" here
        // would flip a mid-trial user's tier back to "free" the moment
        // Stripe fires this event.
        const isEntitled = subscription.status === "active" || subscription.status === "trialing"
        const tier: BillingTier = isEntitled
          ? (getTierFromPriceId(item.price?.id ?? "") ?? "free")
          : "free"

        const { data: updated } = await supabaseAdmin
          .from("profiles")
          .update({
            tier,
            active_trial: subscription.status === "trialing",
            billing_period_start_at: toDateString(item.current_period_start),
            billing_period_end_at: toDateString(item.current_period_end),
          })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .maybeSingle()

        // Canceling schedules the subscription to end at period close — Stripe fires
        // this same "updated" event for that, with status still "active" and the tier
        // unchanged. Only notify when something the customer needs to know about
        // actually changed; the cancellation itself is announced separately by the
        // "deleted" event once the period ends.
        if (updated && !subscription.cancel_at_period_end) {
          await notifyBillingChange({
            userId: updated.id,
            type: "subscription_updated",
            tier,
          })
        }

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: updated } = await supabaseAdmin
          .from("profiles")
          .update({ tier: "free", active_trial: false })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .maybeSingle()

        if (updated) {
          await notifyBillingChange({
            userId: updated.id,
            type: "subscription_deleted",
            tier: "free",
          })
        }

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: updated } = await supabaseAdmin
          .from("profiles")
          .update({ tier: "free", active_trial: false })
          .eq("stripe_customer_id", customerId)
          .select("id")
          .maybeSingle()

        if (updated) {
          await notifyBillingChange({
            userId: updated.id,
            type: "payment_failed",
            tier: "free",
          })
        }

        break
      }

      default:
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("Webhook processing error:", error)
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    )
  }
}
