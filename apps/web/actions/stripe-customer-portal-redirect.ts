"use server"

import Stripe from "stripe"
import { redirect } from "next/navigation"

import { supabaseAdmin } from "@workspace/supabase/admin"
import { supabaseServer } from "@/lib/supabase/server"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"

export async function stripeCustomerPortalRedirect() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("stripe_customer_id")
    .eq("id", user.id)
    .single()

  const stripeCustomerId: string | null = profile?.stripe_customer_id ?? null

  if (!stripeCustomerId) redirect("/dashboard/settings?tab=billing")

  let portalUrl: string | null = null

  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: stripeCustomerId,
      return_url: `${appUrl}/dashboard/settings?tab=billing`,
    })
    portalUrl = session.url
  } catch (err) {
    console.error("Stripe portal error:", err)
  }

  redirect(portalUrl ?? "/dashboard/settings?tab=billing")
}
