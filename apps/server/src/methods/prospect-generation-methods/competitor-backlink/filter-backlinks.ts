import type { BacklinkItem } from "./extract-backlinks.js"
import { createLogger } from "../../../helpers/logger.js"
import { extractDomainFromUrl, isNoisyUrl } from "../shared/url-filters.js"

const log = createLogger("filter-backlinks")

const CAP_PER_COMPETITOR = 15

export type TaggedBacklinkItem = BacklinkItem & {
  competitorDomain: string
}

export type FilterSettings = {
  dr_min: number
  dr_max: number | null
}

export function filterBacklinks(
  items: TaggedBacklinkItem[],
  settings: FilterSettings,
  ownDomain?: string
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
  const noiseFiltered = drFiltered.filter((item) => !isNoisyUrl(item.urlFrom))

  log.info("noise filter", {
    before: drFiltered.length,
    after: noiseFiltered.length,
    dropped: drFiltered.length - noiseFiltered.length,
  })

  // Drop backlinks that originate from the product's own site — a self-referencing
  // comparison/blog page is not an outreach prospect, it's the user's own domain.
  const normalizedOwnDomain = ownDomain ? extractDomainFromUrl(ownDomain) : null
  const clean = normalizedOwnDomain
    ? noiseFiltered.filter((item) => extractDomainFromUrl(item.urlFrom) !== normalizedOwnDomain)
    : noiseFiltered

  if (normalizedOwnDomain) {
    log.info("own-domain filter", {
      before: noiseFiltered.length,
      after: clean.length,
      dropped: noiseFiltered.length - clean.length,
      ownDomain: normalizedOwnDomain,
    })
  }

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

export { extractDomainFromUrl }
