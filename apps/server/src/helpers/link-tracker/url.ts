/** Normalize a URL for equality comparisons: lowercase scheme+host, strip hash and trailing slash. */
export function normalizeUrlForCompare(raw: string | null | undefined): string | null {
  if (!raw) return null
  try {
    const url = new URL(raw)
    url.hash = ""
    const path = url.pathname.replace(/\/+$/, "") || "/"
    return `${url.protocol.toLowerCase()}//${url.host.toLowerCase()}${path}${url.search}`
  } catch {
    return raw.trim()
  }
}

export function urlsMatch(a: string | null | undefined, b: string | null | undefined): boolean {
  const na = normalizeUrlForCompare(a)
  const nb = normalizeUrlForCompare(b)
  return na !== null && na === nb
}

export function isHomepagePath(rawUrl: string): boolean {
  try {
    return new URL(rawUrl).pathname.replace(/\/+$/, "") === ""
  } catch {
    return false
  }
}

/** Whitespace-collapsed, lowercased text for anchor/label comparisons. */
export function normalizeText(raw: string | null | undefined): string {
  return (raw ?? "").replace(/\s+/g, " ").trim().toLowerCase()
}
