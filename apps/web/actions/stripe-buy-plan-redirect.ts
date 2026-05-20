"use server"

import Stripe from "stripe"
import { redirect } from "next/navigation"

import { PLANS } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function stripeBuyPlanRedirect({
  plan,
}: {
  plan: "starter" | "pro"
}) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const planConfig = PLANS.find((p) => p.key === plan)
  if (!planConfig) redirect("/dashboard/billing")

  let sessionUrl: string | null = null

  try {
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer_email: user.email,
      line_items: [{ price: planConfig.stripePriceId, quantity: 1 }],
      allow_promotion_codes: true,
      metadata: { supabase_user_id: user.id },
      success_url: `${appUrl}/dashboard/billing?upgraded=1`,
      cancel_url: `${appUrl}/dashboard/billing`,
    })
    sessionUrl = session.url
  } catch (err) {
    console.error("Stripe checkout error:", err)
  }

  redirect(sessionUrl ?? "/dashboard/billing")
}
