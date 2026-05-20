import posthog from "posthog-js"

type EventProperties = Record<string, string | number | boolean | null | undefined>

function isReady() {
  return typeof window !== "undefined" && posthog.__loaded
}

export function captureEvent(name: string, properties?: EventProperties) {
  if (!isReady()) return
  posthog.capture(name, properties)
}

export function identifyAnalyticsUser(userId: string, traits?: EventProperties) {
  if (!isReady()) return
  posthog.identify(userId, traits)
}

export function resetAnalyticsUser() {
  if (!isReady()) return
  posthog.reset()
}

export function setPersonProperties(properties: EventProperties) {
  if (!isReady()) return
  posthog.people.set(properties)
}
