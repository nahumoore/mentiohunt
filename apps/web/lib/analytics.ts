type EventProperties = Record<string, string | number | boolean | null | undefined>

export function captureEvent(name: string, properties?: EventProperties) {
  if (typeof window === "undefined") return
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ;(window as any).plausible?.(name, properties ? { props: properties } : undefined)
}

export function identifyAnalyticsUser(_userId: string, _traits?: EventProperties) {}

export function resetAnalyticsUser() {}

export function setPersonProperties(_properties: EventProperties) {}
