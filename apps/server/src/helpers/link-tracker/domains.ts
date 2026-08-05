// TS port of apps/scraper/core.py's _normalize_host / _host_matches_target so
// both sides agree on subdomain matching — the scraper resolves anchors
// against a target_domain string, and the Node side needs the identical rule
// to decide whether a competitor entry in products.competitors[] matches an
// href the scraper already resolved.

export function normalizeHost(host: string): string {
  const trimmed = host.toLowerCase().trim().replace(/^\.+/, "")
  return trimmed.startsWith("www.") ? trimmed.slice(4) : trimmed
}

export function hostMatchesTarget(host: string, target: string): boolean {
  const normalizedHost = normalizeHost(host)
  const normalizedTarget = normalizeHost(target)
  if (!normalizedHost) return false
  return normalizedHost === normalizedTarget || normalizedHost.endsWith(`.${normalizedTarget}`)
}

/**
 * products.competitors[] elements are user-entered and may be a bare domain
 * ("rival.com") or a full URL ("https://rival.com/pricing") — normalize
 * defensively both ways rather than assuming a shape.
 */
export function normalizeDomainInput(raw: string): string | null {
  const trimmed = raw.trim()
  if (!trimmed) return null
  try {
    const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`
    return normalizeHost(new URL(withScheme).hostname)
  } catch {
    return normalizeHost(trimmed)
  }
}

export function normalizeCompetitorDomains(competitors: string[] | null | undefined): string[] {
  const normalized = (competitors ?? [])
    .map(normalizeDomainInput)
    .filter((domain): domain is string => Boolean(domain))
  return [...new Set(normalized)]
}
