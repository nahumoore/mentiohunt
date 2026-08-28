export type PersistenceCandidate<T> = {
  item: T
  foundUrl: string
  domain: string
}

export type PersistenceSelection<T> = {
  selected: PersistenceCandidate<T>[]
  duplicatesSkipped: number
}

/** Normalize the registrable domain used as the product-level prospect identity. */
export function normalizeProspectDomain(domainOrUrl: string): string {
  const withProtocol = /^https?:\/\//i.test(domainOrUrl)
    ? domainOrUrl
    : `https://${domainOrUrl}`

  const hostname = (getHostname(withProtocol) ?? domainOrUrl
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/[/:].*$/, "")
  )
    .replace(/\.$/, "")
    .toLowerCase()

  return getDomain(hostname, { allowPrivateDomains: true }) ?? hostname
}

/**
 * Keep one candidate per normalized domain and exclude domains already known
 * for the product. Input order is preserved so strategy scoring remains the
 * source of priority.
 */
export function selectUniqueProspectDomains<T>(
  candidates: PersistenceCandidate<T>[],
  existingDomains: ReadonlySet<string>
): PersistenceSelection<T> {
  const seen = new Set([...existingDomains].map(normalizeProspectDomain))
  const selected: PersistenceCandidate<T>[] = []

  for (const candidate of candidates) {
    const domain = normalizeProspectDomain(candidate.domain || candidate.foundUrl)
    if (!domain || seen.has(domain)) continue
    seen.add(domain)
    selected.push({ ...candidate, domain })
  }

  return {
    selected,
    duplicatesSkipped: candidates.length - selected.length,
  }
}

/** Reserve the mutable attempt budget before any prospect row is inserted. */
export function claimPersistenceBudget<T>(
  candidates: PersistenceCandidate<T>[],
  budget?: { remaining: number }
): { claimed: PersistenceCandidate<T>[]; budgetSkipped: number } {
  if (!budget) return { claimed: candidates, budgetSkipped: 0 }

  const claimCount = Math.min(candidates.length, Math.max(0, budget.remaining))
  budget.remaining -= claimCount
  return {
    claimed: candidates.slice(0, claimCount),
    budgetSkipped: candidates.length - claimCount,
  }
}
import { getDomain, getHostname } from "tldts"
