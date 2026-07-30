// Client-only helpers for capturing visitor context. Kept outside React so
// the "first touch" snapshot (entry URL, referrer, UTMs) is read exactly
// once per page load, not re-derived on every render or navigation.

function readUtm(): Record<string, string> | undefined {
  if (typeof window === "undefined") return undefined
  const params = new URLSearchParams(window.location.search)
  const utm = {
    source: params.get("utm_source") ?? undefined,
    medium: params.get("utm_medium") ?? undefined,
    campaign: params.get("utm_campaign") ?? undefined,
    term: params.get("utm_term") ?? undefined,
    content: params.get("utm_content") ?? undefined,
  }
  return Object.values(utm).some(Boolean)
    ? (Object.fromEntries(
        Object.entries(utm).filter(([, value]) => value !== undefined)
      ) as Record<string, string>)
    : undefined
}

type EntrySnapshot = {
  entryUrl: string
  referrer?: string
  utm?: Record<string, string>
}

let cachedEntrySnapshot: EntrySnapshot | null = null

export function getEntrySnapshot(): EntrySnapshot | null {
  if (typeof window === "undefined") return null
  if (!cachedEntrySnapshot) {
    cachedEntrySnapshot = {
      entryUrl: window.location.href,
      referrer: document.referrer || undefined,
      utm: readUtm(),
    }
  }
  return cachedEntrySnapshot
}

export function getDeviceSnapshot() {
  if (typeof window === "undefined") return {}
  return {
    locale: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
  }
}

/** Whether a support thread already exists, from the non-httpOnly cookie — lets the widget decide to bootstrap without a network round trip on a cold pageview. */
export function hasActiveThreadCookie(): boolean {
  if (typeof document === "undefined") return false
  return document.cookie
    .split("; ")
    .some((entry) => entry.startsWith("mh_support_active="))
}
