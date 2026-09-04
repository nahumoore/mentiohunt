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

const SPAM_TITLE_PHRASES = [
  "pbn",
  "buy backlinks",
  "backlinks for sale",
  "aged domain",
  "aged domains",
  "dofollow backlinks",
  "boost your google rankings",
  "high da backlinks",
  "link building service",
]

// Two or more pictographic emoji in a title is a strong spam/link-farm signal
// (e.g. "🏆🏆Boost your Google rankings with Premium PBN") that legitimate
// editorial titles essentially never trigger.
const EMOJI_PATTERN = /\p{Extended_Pictographic}/gu

// Opaque, machine-generated path shapes used by link-farm/PBN sites:
// /page-<32 hex>.html, /all/<n>/<n>.html, or any bare 24+ hex-char segment.
const OPAQUE_PATH_PATTERNS = [
  /\/page-[0-9a-f]{32}\.html/i,
  /\/all\/\d+\/\d+\.html/i,
  /\/[0-9a-f]{24,}(?:[/.]|$)/i,
]

/**
 * True when a linking page shows spam/link-farm signals that the plain
 * domain/path noise filter (`isNoisyUrl`) does not catch — PBN and
 * backlink-selling phrasing in the title, emoji-stuffed titles, and
 * opaque/hashed path shapes used by auto-generated pages.
 */
export function isSpammyLinkPage(input: { url: string; title?: string | null }): boolean {
  const title = (input.title ?? "").toLowerCase()

  if (title) {
    if (SPAM_TITLE_PHRASES.some((phrase) => title.includes(phrase))) return true
    const emojiMatches = input.title?.match(EMOJI_PATTERN)
    if (emojiMatches && emojiMatches.length >= 2) return true
  }

  let path = ""
  try {
    path = new URL(input.url).pathname
  } catch {
    path = input.url
  }

  return OPAQUE_PATH_PATTERNS.some((pattern) => pattern.test(path))
}
