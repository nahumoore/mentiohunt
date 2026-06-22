type EventProperties = Record<string, string | number | boolean | null | undefined>

const NAME_MAP: Record<string, string> = {
  outreach_email_copied: "email-draft-copied",
}

function toPlausibleName(name: string): string {
  return NAME_MAP[name] ?? name.replace(/_/g, "-")
}

export function captureEvent(name: string, properties?: EventProperties) {
  if (typeof window === "undefined") return
  const plausibleName = toPlausibleName(name)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).plausible?.(plausibleName, properties ? { props: properties } : undefined)
}

export function identifyAnalyticsUser(_userId: string, _traits?: EventProperties) {}

export function resetAnalyticsUser() {}

export function setPersonProperties(_properties: EventProperties) {}
