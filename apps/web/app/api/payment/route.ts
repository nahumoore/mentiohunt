import { headers } from "next/headers"
import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"

import { supabaseAdmin } from "@workspace/supabase/admin"
import { PLANS } from "@/consts/billing"
import type { BillingTier } from "@/consts/billing"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

function getTierFromPriceId(priceId: string): BillingTier | null {
  return PLANS.find((p) => p.stripePriceId === priceId)?.tier ?? null
}

function toDateString(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString().substring(0, 10)
}

export async function POST(req: NextRequest) {
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
            active_trial: false,
            stripe_customer_id: customerId,
            billing_period_start_at: toDateString(item.current_period_start),
            billing_period_end_at: toDateString(item.current_period_end),
          })
          .eq("id", profile.id)

        break
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const item = subscription.items.data[0]
        if (!item) break
        const isActive = subscription.status === "active"
        const tier: BillingTier = isActive
          ? (getTierFromPriceId(item.price?.id ?? "") ?? "free")
          : "free"

        await supabaseAdmin
          .from("profiles")
          .update({
            tier,
            active_trial: false,
            billing_period_start_at: toDateString(item.current_period_start),
            billing_period_end_at: toDateString(item.current_period_end),
          })
          .eq("stripe_customer_id", customerId)

        break
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        await supabaseAdmin
          .from("profiles")
          .update({ tier: "free", active_trial: false })
          .eq("stripe_customer_id", customerId)

        break
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        await supabaseAdmin
          .from("profiles")
          .update({ tier: "free", active_trial: false })
          .eq("stripe_customer_id", customerId)

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
