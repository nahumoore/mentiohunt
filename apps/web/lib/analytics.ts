type EventProperties = Record<string, string | number | boolean | null | undefined>

export function captureEvent(_name: string, _properties?: EventProperties) {}

export function identifyAnalyticsUser(_userId: string, _traits?: EventProperties) {}

export function resetAnalyticsUser() {}

export function setPersonProperties(_properties: EventProperties) {}
