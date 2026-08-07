import { createLogger } from "../../../helpers/logger.js"
import { extractDomainFromUrl, isNoisyUrl } from "../shared/url-filters.js"
import type { DeadLinkCandidate } from "./types.js"

const log = createLogger("filter-dead-link-candidates")

const CAP_PER_COMPETITOR = 15

export type FilterSettings = {
  dr_min: number
  dr_max: number | null
}

export function filterDeadLinkCandidates(
  items: DeadLinkCandidate[],
  settings: FilterSettings,
  ownDomain?: string
): DeadLinkCandidate[] {
  const drFiltered = items.filter((item) => {
    if (item.domainRating < settings.dr_min) return false
    if (settings.dr_max !== null && item.domainRating > settings.dr_max) return false
    return true
  })

  const noiseFiltered = drFiltered.filter((item) => !isNoisyUrl(item.urlFrom))

  const normalizedOwnDomain = ownDomain ? extractDomainFromUrl(ownDomain) : null
  const clean = normalizedOwnDomain
    ? noiseFiltered.filter((item) => extractDomainFromUrl(item.urlFrom) !== normalizedOwnDomain)
    : noiseFiltered

  // Dedup by linking domain (keep highest DR), cap per competitor — same
  // shape as filterBacklinks in competitor-backlink, one competitor at a
  // time here since this is called per-competitor inside processCompetitor.
  const bestByDomain = new Map<string, DeadLinkCandidate>()
  for (const item of clean) {
    const linkingDomain = extractDomainFromUrl(item.urlFrom)
    const current = bestByDomain.get(linkingDomain)
    if (!current || item.domainRating > current.domainRating) {
      bestByDomain.set(linkingDomain, item)
    }
  }

  const deduped = [...bestByDomain.values()].sort((a, b) => b.domainRating - a.domainRating)
  const capped = deduped.slice(0, CAP_PER_COMPETITOR)

  log.info("filter complete", {
    before: items.length,
    afterDrFilter: drFiltered.length,
    afterNoiseFilter: noiseFiltered.length,
    afterOwnDomainFilter: clean.length,
    afterDedup: deduped.length,
    afterCap: capped.length,
  })

  return capped
}
