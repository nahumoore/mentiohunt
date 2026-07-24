type AhrefsDomainRatingResponse = {
  domain_rating?: {
    domain_rating?: number | null
    license?: string
  }
}

function normalizeTarget(raw: string): string {
  const trimmed = raw.trim()
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`

  try {
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return trimmed
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

export async function getDomainRating(target: string): Promise<number | null> {
  const normalizedTarget = normalizeTarget(target)
  const url = new URL("https://api.ahrefs.com/v3/public/domain-rating-free")
  url.searchParams.set("target", normalizedTarget)
  url.searchParams.set("output", "json")

  const res = await fetch(url, {
    headers: {
      Accept: "application/json",
      Authorization: `Bearer ${process.env.AHREFS_API_KEY}`,
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!res.ok) {
    let body = ""
    try {
      body = await res.text()
    } catch {
      // Ignore read failures and surface the HTTP status.
    }
    throw new Error(`Ahrefs ${res.status}: ${res.statusText}${body ? ` — ${body}` : ""}`)
  }

  const json = (await res.json()) as AhrefsDomainRatingResponse
  const value = json.domain_rating?.domain_rating
  return typeof value === "number" && Number.isFinite(value) ? Math.round(value) : null
}
