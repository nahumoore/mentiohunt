import posthog from "posthog-js"

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>

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
  if (!initializeAnalytics()) return
  posthog.capture(name, properties)
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
