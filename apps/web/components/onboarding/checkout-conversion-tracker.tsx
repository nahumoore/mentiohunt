"use client"

import { useEffect } from "react"

import { pushConversionEvent } from "@/lib/analytics"
import { EVENTS } from "@/lib/analytics-events"

interface CheckoutConversionTrackerProps {
  userId: string
  plan: string
  value: number
  isTrialing: boolean
  trialDays: number
}

/**
 * checkout_completed/trial_started are already recorded in PostHog
 * server-side (see app/onboarding/checkout-complete/route.ts, where Stripe
 * confirms payment) — but Google Ads' GTM tag only fires from a browser, and
 * this welcome page is the one render new subscribers land on after that
 * redirect. Deduped per user since back/refresh can re-render this page
 * before the referral form is submitted.
 */
export function CheckoutConversionTracker({
  userId,
  plan,
  value,
  isTrialing,
  trialDays,
}: CheckoutConversionTrackerProps) {
  useEffect(() => {
    const dedupeKey = `gtm_checkout_completed_${userId}`
    try {
      if (localStorage.getItem(dedupeKey)) return
      localStorage.setItem(dedupeKey, "1")
    } catch {
      return
    }

    pushConversionEvent(EVENTS.CHECKOUT_COMPLETED, {
      plan,
      value,
      currency: "USD",
      trial_days: isTrialing ? trialDays : 0,
    })
    if (isTrialing) {
      pushConversionEvent(EVENTS.TRIAL_STARTED, { plan, trial_days: trialDays })
    }
  }, [userId, plan, value, isTrialing, trialDays])

  return null
}
