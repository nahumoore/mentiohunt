export type AnchorType =
  | "exact-match"
  | "partial-match"
  | "branded"
  | "lsi"
  | "long-tail"
  | "generic"
  | "naked-url"

export type SafetyLevel = "safe" | "use-sparingly" | "avoid-overuse"

export interface AnchorVariant {
  text: string
  type: AnchorType
  safety: SafetyLevel
  note: string
}

const TYPE_LABELS: Record<AnchorType, string> = {
  "exact-match": "Exact match",
  "partial-match": "Partial match",
  branded: "Branded",
  lsi: "LSI / synonym",
  "long-tail": "Long-tail",
  generic: "Generic",
  "naked-url": "Naked URL",
}

const SAFETY_LABELS: Record<SafetyLevel, string> = {
  safe: "Safe",
  "use-sparingly": "Use sparingly",
  "avoid-overuse": "Avoid overuse",
}

export { SAFETY_LABELS, TYPE_LABELS }

const LSI_SWAP_MAP: Record<string, string[]> = {
  "link building": [
    "backlink acquisition",
    "link prospecting",
    "link outreach",
  ],
  backlink: ["inbound link", "external link", "referring link"],
  "seo tool": [
    "search optimization tool",
    "ranking tool",
    "organic growth tool",
  ],
  outreach: ["link outreach", "email prospecting", "pitch outreach"],
  "anchor text": ["link anchor", "hyperlink text", "link label"],
  generator: ["builder", "creator", "maker"],
  checker: ["analyzer", "auditor", "validator"],
  finder: ["discovery tool", "prospecting tool", "scanner"],
  calculator: ["estimator", "pricing tool", "cost estimator"],
}

function extractBrand(url: string): string | null {
  try {
    const withProtocol = url.startsWith("http") ? url : `https://${url}`
    const hostname = new URL(withProtocol).hostname.replace(/^www\./, "")
    return hostname.split(".")[0] ?? null
  } catch {
    return null
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function applyLsiSwaps(keyword: string): string[] {
  const lower = keyword.toLowerCase()
  const results: string[] = []
  for (const [term, swaps] of Object.entries(LSI_SWAP_MAP)) {
    if (lower.includes(term)) {
      for (const swap of swaps) {
        const swapped = lower.replace(term, swap)
        if (swapped !== lower) results.push(swapped)
      }
    }
  }
  return results
}

function buildPartials(keyword: string): string[] {
  const words = keyword.trim().split(/\s+/)
  if (words.length <= 1) return []
  const results: string[] = []
  if (words.length >= 2) {
    results.push(words.slice(0, 2).join(" "))
    results.push(words.slice(-2).join(" "))
  }
  if (words.length >= 3) {
    results.push(words.slice(0, 3).join(" "))
  }
  return [...new Set(results)].filter((p) => p !== keyword.toLowerCase())
}

export function generateAnchors(
  keyword: string,
  url?: string
): AnchorVariant[] {
  const kw = keyword.trim()
  if (!kw) return []

  const results: AnchorVariant[] = []
  const seen = new Set<string>()

  function add(v: AnchorVariant) {
    const key = v.text.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    results.push(v)
  }

  // Exact match
  add({
    text: kw,
    type: "exact-match",
    safety: "use-sparingly",
    note: "Strongest topical signal but most scrutinized. Keep exact-match anchors under ~5% of your link profile to stay inside natural ranges.",
  })

  // Exact match capitalized variant
  add({
    text: capitalize(kw),
    type: "exact-match",
    safety: "use-sparingly",
    note: "Same topical signal as lowercase exact match. Looks natural at the start of a sentence.",
  })

  // Partial matches
  const partials = buildPartials(kw)
  for (const p of partials.slice(0, 2)) {
    add({
      text: p,
      type: "partial-match",
      safety: "safe",
      note: "Partial match anchors carry topical relevance without triggering exact-match thresholds. Good for the bulk of your profile.",
    })
  }

  // Long-tail
  add({
    text: `best ${kw}`,
    type: "long-tail",
    safety: "safe",
    note: "Modifier-prefixed variants read naturally in reviews and roundups and carry strong intent signals without exact-match risk.",
  })
  add({
    text: `${kw} for founders`,
    type: "long-tail",
    safety: "safe",
    note: "Audience-qualified long-tail. Natural in ICP-specific blog posts. Helps map the link to a target reader context.",
  })

  // LSI swaps
  const lsiVariants = applyLsiSwaps(kw)
  for (const lsi of lsiVariants.slice(0, 2)) {
    add({
      text: lsi,
      type: "lsi",
      safety: "safe",
      note: "Semantically related anchor. Adds topical diversity to your profile without repeating the exact keyword string.",
    })
  }

  // Branded
  if (url) {
    const brand = extractBrand(url)
    if (brand) {
      add({
        text: capitalize(brand),
        type: "branded",
        safety: "safe",
        note: "Pure brand anchor. Authority links from press and directories are almost always branded. Healthy profiles lean on these.",
      })
      add({
        text: `${capitalize(brand)} ${kw}`,
        type: "branded",
        safety: "safe",
        note: "Brand + keyword combination. Signals topical relevance while keeping the brand name front and center.",
      })
      add({
        text: `${capitalize(brand)}: ${kw}`,
        type: "branded",
        safety: "safe",
        note: "Colon-separated form common in citation-style references. Reads naturally in roundups and resource pages.",
      })
    }

    // Naked URL
    try {
      const withProtocol = url.startsWith("http") ? url : `https://${url}`
      const naked = new URL(withProtocol).hostname.replace(/^www\./, "")
      add({
        text: naked,
        type: "naked-url",
        safety: "safe",
        note: "Domain-only naked URL. Extremely natural — mirrors how most people cite a site in editorial content.",
      })
    } catch {
      // skip malformed URL
    }
  }

  return results
}
