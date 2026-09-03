import pLimit from "p-limit"
import { getDomainRating } from "../../../helpers/ahrefs/get-domain-rating.js"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("enrich-domain-ratings")

const CONCURRENCY = 8
const CACHE_TTL_MS = 24 * 60 * 60 * 1_000

// Process-wide, in-memory only — resets on deploy/restart. There is no
// domain->DR cache table today; this at least kills repeat lookups for the
// same domain within a run and across runs in the same process (a listicle
// run alone can see 200+ unique domains, and the same competitor domains
// recur across strategies in the same preview).
const drCache = new Map<string, { rating: number | null; expiresAt: number }>()

// Same normalization getDomainRating applies internally, duplicated here so
// the cache key matches what was actually looked up.
function normalizeDomain(raw: string): string {
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

/**
 * Look up domain ratings for the given domains via Ahrefs. Best-effort per
 * domain: one domain's failure (rate limit, timeout, transient 5xx) must
 * never zero out the whole batch, since callers increasingly call this
 * before any fetch/scoring work happens (see the 2026-09-02 preview-speed
 * ticket) — a single bad lookup silently discarding every candidate would be
 * worse than the slow-but-correct ordering it replaced.
 */
export async function enrichDomainRatings(domains: string[]): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>()
  if (domains.length === 0) return map
  if (!process.env.AHREFS_API_KEY) return map

  const now = Date.now()
  const toFetch: string[] = []
  for (const domain of domains) {
    const key = normalizeDomain(domain)
    const cached = drCache.get(key)
    if (cached && cached.expiresAt > now) {
      map.set(domain, cached.rating)
    } else {
      toFetch.push(domain)
    }
  }

  if (toFetch.length === 0) return map

  const limit = pLimit(CONCURRENCY)
  await Promise.all(
    toFetch.map((domain) =>
      limit(async () => {
        try {
          const rating = await getDomainRating(domain)
          map.set(domain, rating)
          drCache.set(normalizeDomain(domain), { rating, expiresAt: now + CACHE_TTL_MS })
        } catch (err) {
          // Isolated per-domain — deliberately not a shared try/catch around
          // the whole Promise.all, which would let one failure blank out
          // every other domain's already-resolved rating.
          log.warn("DR lookup failed for domain", { domain, error: String(err) })
        }
      })
    )
  )

  return map
}

/**
 * Shared DR-range filter for the SERP-based strategies (listicle, unlinked
 * mention, resource page). Resolves ratings once for the deduped domain set
 * and applies `dr_min`/`dr_max` before the caller spends a page fetch or LLM
 * score on anything — moving this earlier is the whole point of the
 * 2026-09-02 preview-speed ticket's DR-first ordering.
 *
 * No-ops (keeps everything, `domainRating: null`) when neither bound is set,
 * matching each strategy's existing "only filter when the user asked for a
 * DR range" behavior.
 *
 * `keepUnknown` controls what happens when a domain's DR can't be resolved
 * (no Ahrefs key, lookup failure, non-numeric response) — the ticket
 * requires preview mode to never silently drop a candidate over an
 * unresolved lookup, so preview callers pass `true`.
 */
export async function filterCandidatesByDrRange<T>(
  candidates: T[],
  getDomain: (candidate: T) => string,
  settings: { dr_min: number; dr_max: number | null },
  opts: { keepUnknown: boolean }
): Promise<{
  kept: (T & { domainRating: number | null })[]
  outOfRange: number
  unresolved: number
}> {
  if (settings.dr_min <= 0 && settings.dr_max === null) {
    return {
      kept: candidates.map((candidate) => ({ ...candidate, domainRating: null })),
      outOfRange: 0,
      unresolved: 0,
    }
  }

  const domains = [...new Set(candidates.map(getDomain))]
  const drByDomain = await enrichDomainRatings(domains)

  let outOfRange = 0
  let unresolved = 0
  const kept: (T & { domainRating: number | null })[] = []

  for (const candidate of candidates) {
    const dr = drByDomain.get(getDomain(candidate)) ?? null
    if (dr === null) {
      unresolved += 1
      if (opts.keepUnknown) kept.push({ ...candidate, domainRating: null })
      continue
    }
    if (dr < settings.dr_min || (settings.dr_max !== null && dr > settings.dr_max)) {
      outOfRange += 1
      continue
    }
    kept.push({ ...candidate, domainRating: dr })
  }

  return { kept, outOfRange, unresolved }
}
