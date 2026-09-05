import posthog from "posthog-js"
import { sendGTMEvent } from "@next/third-parties/google"

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>

function pushToDataLayer(name: string, properties?: EventProperties) {
  if (typeof window === "undefined" || process.env.NODE_ENV === "development")
    return
  sendGTMEvent({ event: name, ...properties })
}

const posthogToken = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN
const posthogHost =
  process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com"

export function initializeAnalytics() {
  if (
    typeof window === "undefined" ||
    !posthogToken ||
    process.env.NODE_ENV !== "production"
  ) {
    return false
  }

  if (!posthog.__loaded) {
    posthog.init(posthogToken, {
      api_host: posthogHost,
      capture_pageview: true,
      capture_pageleave: true,
      autocapture: true,
      person_profiles: "identified_only",
    })
  }

  return posthog.__loaded
}

export function captureEvent(name: string, properties?: EventProperties) {
  pushToDataLayer(name, properties)
  if (!initializeAnalytics()) return
  posthog.capture(name, properties)
}

/**
 * For events already recorded server-side in PostHog (checkout_completed,
 * trial_started — see server-analytics.ts) that still need a browser-side
 * fire so Google Ads' GTM tag can see them. Skips posthog.capture to avoid
 * double-counting the same event there.
 */
export function pushConversionEvent(name: string, properties?: EventProperties) {
  pushToDataLayer(name, properties)
}

export function identifyAnalyticsUser(
  userId: string,
  traits?: EventProperties
) {
  if (!initializeAnalytics()) return
  posthog.identify(userId, traits)
}

export function resetAnalyticsUser() {
  if (!initializeAnalytics()) return
  posthog.reset()
}

export function setPersonProperties(properties: EventProperties) {
  if (!initializeAnalytics()) return
  posthog.setPersonProperties(properties)
}
