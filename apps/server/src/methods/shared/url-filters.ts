export const NOISE_DOMAINS = new Set([
  "github.com",
  "chrome.google.com",
  "apps.apple.com",
  "play.google.com",
  "web.archive.org",
  "reddit.com",
  "twitter.com",
  "x.com",
  "linkedin.com",
  "facebook.com",
  "youtube.com",
  "wikipedia.org",
  "pinterest.com",
  "instagram.com",
  "tiktok.com",
  "quora.com",
  "medium.com",
  "amazon.com",
  "google.com",
  "producthunt.com",
  "crunchbase.com",
  "yelp.com",
  "trustpilot.com",
  "g2.com",
])

const NOISE_PATH_SEGMENTS = ["/user/", "/profile/", "/members/", "/author/"]

export function extractDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

function matchesNoiseDomain(domain: string): boolean {
  return [...NOISE_DOMAINS].some(
    (noiseDomain) => domain === noiseDomain || domain.endsWith(`.${noiseDomain}`)
  )
}

/** True when a domain (or URL) belongs to a big aggregator/social we never pitch. */
export function isNoiseDomain(domainOrUrl: string): boolean {
  return matchesNoiseDomain(extractDomainFromUrl(domainOrUrl))
}

export function isNoisyUrl(url: string): boolean {
  const domain = extractDomainFromUrl(url)
  if (matchesNoiseDomain(domain)) return true

  let path = ""
  try {
    path = new URL(url).pathname.toLowerCase()
  } catch {
    path = url.toLowerCase()
  }

  return NOISE_PATH_SEGMENTS.some((seg) => path.includes(seg))
}
