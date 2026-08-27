import posthog from "posthog-js"
import type { CaptureResult } from "posthog-js"

type EventProperties = Record<
  string,
  string | number | boolean | null | undefined
>

// Next.js signals navigation by throwing an internal "NEXT_REDIRECT" error.
// A redirecting call site can let that signal reach an unhandled rejection,
// where autocapture files it as a real exception. Drop it so it never buries
// genuine failures in error tracking.
function dropNextRedirectExceptions(
  event: CaptureResult | null
): CaptureResult | null {
  if (!event || event.event !== "$exception") return event

  const values = event.properties?.$exception_list as
    | Array<{ type?: string; value?: string }>
    | undefined
  const isRedirect = values?.some(
    (item) =>
      item.type?.includes("NEXT_REDIRECT") ||
      item.value?.includes("NEXT_REDIRECT")
  )

  return isRedirect ? null : event
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
      before_send: dropNextRedirectExceptions,
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
