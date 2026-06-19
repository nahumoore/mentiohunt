import type { AhrefsBacklinkItem } from "../../helpers/actors/ahrefs-seo-tools.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("filter-backlinks")

const CAP_PER_COMPETITOR = 15

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

export type TaggedBacklinkItem = AhrefsBacklinkItem & {
  competitorDomain: string
}

export type FilterSettings = {
  dr_min: number
  dr_max: number | null
}

function extractDomainFromUrl(url: string): string {
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

function isNoisyUrl(urlFrom: string): boolean {
  const domain = extractDomainFromUrl(urlFrom)
  if (matchesNoiseDomain(domain)) return true

  let path = ""
  try {
    path = new URL(urlFrom).pathname.toLowerCase()
  } catch {
    path = urlFrom.toLowerCase()
  }

  return NOISE_PATH_SEGMENTS.some((seg) => path.includes(seg))
}

export function filterBacklinks(
  items: TaggedBacklinkItem[],
  settings: FilterSettings
): TaggedBacklinkItem[] {
  // Apply DR range filter
  const drFiltered = items.filter((item) => {
    if (item.domainRating < settings.dr_min) return false
    if (settings.dr_max !== null && item.domainRating > settings.dr_max)
      return false
    return true
  })

  log.info("dr filter", {
    before: items.length,
    after: drFiltered.length,
    dropped: items.length - drFiltered.length,
    dr_min: settings.dr_min,
    dr_max: settings.dr_max,
  })

  // Remove noise
  const clean = drFiltered.filter((item) => !isNoisyUrl(item.urlFrom))

  log.info("noise filter", {
    before: drFiltered.length,
    after: clean.length,
    dropped: drFiltered.length - clean.length,
  })

  // Group by competitor domain, dedup by linking domain (keep highest DR), cap at 15
  const byCompetitor = new Map<string, TaggedBacklinkItem[]>()
  for (const item of clean) {
    const group = byCompetitor.get(item.competitorDomain) ?? []
    group.push(item)
    byCompetitor.set(item.competitorDomain, group)
  }

  const result: TaggedBacklinkItem[] = []
  for (const [competitor, group] of byCompetitor) {
    // Dedup by linking domain — keep highest DR
    const bestByDomain = new Map<string, TaggedBacklinkItem>()
    for (const item of group) {
      const linkingDomain = extractDomainFromUrl(item.urlFrom)
      const current = bestByDomain.get(linkingDomain)
      if (!current || item.domainRating > current.domainRating) {
        bestByDomain.set(linkingDomain, item)
      }
    }

    // Sort by DR desc, take top 15
    const deduped = [...bestByDomain.values()].sort(
      (a, b) => b.domainRating - a.domainRating
    )
    const capped = deduped.slice(0, CAP_PER_COMPETITOR)

    log.info("competitor dedup + cap", {
      competitor,
      beforeDedup: group.length,
      afterDedup: deduped.length,
      afterCap: capped.length,
    })

    result.push(...capped)
  }

  log.info("filter complete", { total: result.length })

  return result
}

/** True when a domain (or URL) belongs to a big aggregator/social we never pitch. */
export function isNoiseDomain(domainOrUrl: string): boolean {
  return matchesNoiseDomain(extractDomainFromUrl(domainOrUrl))
}

export { extractDomainFromUrl }
