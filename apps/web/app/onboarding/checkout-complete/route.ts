import { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import Stripe from "stripe"

import { FREE_TRIAL_MAX_PAGES, PLANS } from "@/consts/billing"
import type { BillingTier } from "@/consts/billing"
import { startDiscoveryJobs } from "@/lib/onboarding/start-discovery-jobs"
import { supabaseServer } from "@/lib/supabase/server"
import type { TablesUpdate } from "@workspace/supabase/database-types"

export const runtime = "nodejs"

function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY not set")
  return new Stripe(process.env.STRIPE_SECRET_KEY)
}

function getTierFromPriceId(priceId: string): BillingTier | null {
  return PLANS.find((p) => p.stripePriceId === priceId)?.tier ?? null
}

function toDateString(unixTimestamp: number): string {
  return new Date(unixTimestamp * 1000).toISOString().substring(0, 10)
}

/**
 * Closes the loop on the onboarding paywall's Stripe Checkout synchronously —
 * this runs before the webhook (app/api/payment/route.ts) reliably lands, so
 * the user isn't stuck staring at a redirect while waiting on it. Writes the
 * same profile fields the webhook writes, then kicks off the discovery jobs
 * that app/api/onboarding/complete/route.ts deferred when the wizard called
 * it with startOutreach: false.
 */
export async function GET(request: NextRequest) {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const sessionId = request.nextUrl.searchParams.get("session_id")
  if (!sessionId) redirect("/onboarding")

  const stripe = getStripe()

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription"],
    })
  } catch (err) {
    console.error("Failed to retrieve checkout session:", err)
    redirect("/onboarding")
  }

  // Prevent replaying someone else's session id.
  if (session.metadata?.supabase_user_id !== user.id) {
    redirect("/onboarding")
  }

  const subscription = session.subscription as Stripe.Subscription | null
  if (!subscription || (subscription.status !== "trialing" && subscription.status !== "active")) {
    redirect("/onboarding")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("onboarding_completed")
    .eq("id", user.id)
    .maybeSingle()

  // Refresh/back-button safe — already ran once for this account.
  if (profile?.onboarding_completed) {
    redirect("/dashboard/prospects")
  }

  const item = subscription.items.data[0]
  const tier = getTierFromPriceId(item?.price?.id ?? "") ?? "pro"

  const profileUpdate: TablesUpdate<"profiles"> = {
    tier,
    active_trial: subscription.status === "trialing",
    stripe_customer_id: subscription.customer as string,
    onboarding_completed: true,
    ...(item
      ? {
          billing_period_start_at: toDateString(item.current_period_start),
          billing_period_end_at: toDateString(item.current_period_end),
        }
      : {}),
  }

  const { error: updateProfileError } = await supabase
    .from("profiles")
    .update(profileUpdate)
    .eq("id", user.id)

  if (updateProfileError) {
    console.error("Error finalizing onboarding checkout:", updateProfileError)
    redirect("/onboarding")
  }

  const { data: product } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle()

  if (!product) {
    // Setup wasn't saved before checkout — shouldn't happen given the wizard
    // always calls /api/onboarding/complete before reaching the paywall
    // step, but without a product there's nothing to run discovery against.
    console.error("No product found after onboarding checkout for user:", user.id)
    redirect("/onboarding")
  }

  await startDiscoveryJobs({
    userId: user.id,
    productId: product.id,
    crawlLimit: FREE_TRIAL_MAX_PAGES,
    autoDiscoverPages: session.metadata?.onboarding_auto_discover === "1",
  }).catch((error) => {
    console.error("Failed to reach the onboarding server:", error)
  })

  redirect("/dashboard/prospects?trial_started=1")
}

export const dynamic = "force-dynamic"
