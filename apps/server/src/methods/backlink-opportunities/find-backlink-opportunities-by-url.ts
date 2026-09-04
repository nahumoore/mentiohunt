import pLimit from "p-limit"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
} from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import { enrichDomainRatings } from "../prospect-generation-methods/shared/enrich-domain-ratings.js"
import {
  extractDomainFromUrl,
  isNoiseDomain,
} from "../prospect-generation-methods/shared/url-filters.js"
import { scoreSiteRelevance } from "../prospect-generation-methods/shared/score-site-relevance.js"
import { deriveNiches } from "../guest-post-sites/derive-niches.js"
import { deriveProductProfile } from "../site-profile/derive-product-profile.js"
import {
  DEFAULT_LIMITS,
  OPPORTUNITY_QUERY_TEMPLATES,
  type FindBacklinkOpportunitiesInput,
  type FindBacklinkOpportunitiesResult,
} from "./types.js"

const log = createLogger("find-backlink-opportunities-by-url")

type QueryPlanItem = (typeof OPPORTUNITY_QUERY_TEMPLATES)[number] & {
  query: string
  niche: string
}

export type Candidate = {
  id: string
  domain: string
  url: string
  title: string
  snippet: string
  niche: string
  query: string
  footprintLabel: string
  type: string
}

function buildQueryPlan(niches: string[]): QueryPlanItem[] {
  const templates = OPPORTUNITY_QUERY_TEMPLATES.slice(
    0,
    DEFAULT_LIMITS.queryTemplatesPerNiche
  )

  return niches.flatMap((niche) =>
    templates.map((template) => ({
      ...template,
      query: template.query.replace("{niche}", niche),
      niche,
    }))
  )
}

function inferType(candidate: Candidate): string {
  const path = new URL(candidate.url).pathname.toLowerCase()
  if (path.includes("resource") || path.includes("links")) return "Resource Page"
  if (path.includes("roundup") || path.includes("tools") || path.includes("list")) {
    return "Link Roundup"
  }
  return candidate.type || "Niche Blog"
}

function buildReason(candidate: Candidate): string {
  const snippet = candidate.snippet.trim().replace(/\s+/g, " ")
  const context = snippet ? ` Search context: “${snippet.slice(0, 240)}”` : ""
  return `Found for a ${candidate.footprintLabel} search around ${candidate.niche}.${context}`
}

/**
 * A root path or a bare hub path (/blog, /resources) is a weaker outreach
 * target than a specific article — it's usually the footprint aggregator's
 * own landing page rather than a page that actually lists third-party tools.
 * Higher score wins; used to pick which candidate to keep when a domain
 * surfaces under more than one query.
 */
function candidateSpecificityScore(url: string): number {
  let path = ""
  try {
    path = new URL(url).pathname.toLowerCase()
  } catch {
    return 0
  }

  const segments = path.split("/").filter(Boolean)
  if (segments.length === 0) return 0

  const lastSegment = segments[segments.length - 1] ?? ""
  const isBareHub = segments.length === 1 && /^(blog|resources|links|tools)$/.test(lastSegment)
  if (isBareHub) return 1

  // Deeper, hyphenated slugs read as an actual article/listing page.
  let score = segments.length
  if (lastSegment.includes("-")) score += 1
  return score
}

/** Picks which of two candidates for the same domain to keep — see candidateSpecificityScore. */
export function pickBestCandidateForDomain(incumbent: Candidate, next: Candidate): Candidate {
  return candidateSpecificityScore(next.url) > candidateSpecificityScore(incumbent.url) ? next : incumbent
}

/**
 * Drops a domain only when its DR is known and below the floor — a failed
 * lookup (domain not in drByDomain, or an explicit null) is kept rather than
 * silently dropped, since enrichDomainRatings no-ops entirely in environments
 * without AHREFS_API_KEY.
 */
export function applyDomainRatingFloor<T extends { domain: string }>(
  candidates: T[],
  drByDomain: Map<string, number | null>,
  floor: number
): T[] {
  return candidates.filter((candidate) => {
    const dr = drByDomain.get(candidate.domain)
    if (dr === undefined || dr === null) return true
    return dr >= floor
  })
}

/** Replaces the old `score > 0` gate — a real minimum, not just "not zero". */
export function applyRelevanceFloor<T>(
  scoredItems: { item: T; score: number }[],
  floor: number
): { item: T; score: number }[] {
  return scoredItems.filter(({ score }) => score >= floor)
}

export async function findBacklinkOpportunitiesByUrl(
  input: FindBacklinkOpportunitiesInput
): Promise<FindBacklinkOpportunitiesResult> {
  const { url, productName, siteContext } = input
  const ownDomain = extractDomainFromUrl(url)

  log.info("discovery started", { url, productName })

  const { profile } = await deriveProductProfile({
    url,
    title: siteContext?.title ?? productName,
    metaDescription: siteContext?.metaDescription,
    h1: siteContext?.h1,
    paragraphs: siteContext?.paragraphs,
  })

  if (profile.confidence === "low") {
    log.info("low-confidence product profile, declining to guess niches", { url })
    return {
      url,
      productName,
      niches: [],
      queriesRun: 0,
      found: 0,
      scored: 0,
      highFit: 0,
      returned: 0,
      lowConfidence: true,
      opportunities: [],
    }
  }

  const { niches } = await deriveNiches(profile.productName, siteContext, {
    productDescription: profile.productDescription,
    allowBrandFallback: false,
  })
  const queryPlan = buildQueryPlan(niches)

  if (queryPlan.length === 0) {
    return {
      url,
      productName,
      niches,
      queriesRun: 0,
      found: 0,
      scored: 0,
      highFit: 0,
      returned: 0,
      lowConfidence: true,
      opportunities: [],
    }
  }

  const serpLimit = pLimit(3)
  const serpBatches = await Promise.all(
    queryPlan.map((plan) =>
      serpLimit(async () => {
        try {
          const serp = await runApifyActor<GoogleSerpItem[]>(
            SCRAPERLINK_GOOGLE_SERP,
            {
              keyword: plan.query,
              limit: DEFAULT_LIMITS.serpResultsPerQuery,
              country: DEFAULT_LIMITS.country,
              include_merged: false,
            },
            90
          )
          return { plan, results: serp.flatMap((item) => item.results ?? []) }
        } catch (err) {
          log.warn("SERP query failed", { url, query: plan.query, error: String(err) })
          return { plan, results: [] }
        }
      })
    )
  )

  const candidatesByDomain = new Map<string, Candidate>()
  for (const batch of serpBatches) {
    for (const result of batch.results) {
      if (!result.url) continue

      let normalizedUrl: string
      try {
        const parsed = new URL(result.url)
        parsed.hash = ""
        normalizedUrl = parsed.toString().replace(/\/$/, "")
      } catch {
        continue
      }

      const domain = extractDomainFromUrl(normalizedUrl)
      if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue

      const candidate: Candidate = {
        id: domain,
        domain,
        url: normalizedUrl,
        title: result.title ?? "",
        snippet: result.description ?? "",
        niche: batch.plan.niche,
        query: batch.plan.query,
        footprintLabel: batch.plan.footprintLabel,
        type: batch.plan.type,
      }

      const incumbent = candidatesByDomain.get(domain)
      candidatesByDomain.set(domain, incumbent ? pickBestCandidateForDomain(incumbent, candidate) : candidate)
    }
  }

  const cappedCandidates = [...candidatesByDomain.values()].slice(0, DEFAULT_LIMITS.maxCandidates)
  if (cappedCandidates.length === 0) {
    return {
      url,
      productName,
      niches,
      queriesRun: queryPlan.length,
      found: 0,
      scored: 0,
      highFit: 0,
      returned: 0,
      lowConfidence: false,
      opportunities: [],
    }
  }

  // DR floor runs before relevance scoring — no point paying for an LLM call
  // on a domain we're going to drop anyway.
  const drByDomain = await enrichDomainRatings(cappedCandidates.map((c) => c.domain))
  const candidates = applyDomainRatingFloor(cappedCandidates, drByDomain, DEFAULT_LIMITS.drFloor)

  log.info("dr floor applied", {
    before: cappedCandidates.length,
    after: candidates.length,
    dropped: cappedCandidates.length - candidates.length,
    floor: DEFAULT_LIMITS.drFloor,
  })

  if (candidates.length === 0) {
    return {
      url,
      productName,
      niches,
      queriesRun: queryPlan.length,
      found: cappedCandidates.length,
      scored: 0,
      highFit: 0,
      returned: 0,
      lowConfidence: false,
      opportunities: [],
    }
  }

  const { results: scores } = await scoreSiteRelevance(
    candidates.map((candidate) => ({
      id: candidate.id,
      domain: candidate.domain,
      title: candidate.title,
      snippet: candidate.snippet,
    })),
    {
      product_name: profile.productName,
      product_description: profile.productDescription,
    }
  )

  const scoredCandidates = applyRelevanceFloor(
    candidates.map((candidate) => ({ item: candidate, score: scores.get(candidate.id)?.score ?? 0 })),
    DEFAULT_LIMITS.scoreFloor
  )
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_LIMITS.maxOpportunities)

  const opportunities = scoredCandidates.map(({ item: candidate, score }, index) => ({
    id: String(index + 1),
    domain: candidate.domain,
    name: candidate.title || candidate.domain,
    type: inferType(candidate),
    score: Math.max(0, Math.min(100, Math.round(score))),
    dr: drByDomain.get(candidate.domain) ?? null,
    url: candidate.url,
    reason: buildReason(candidate),
  }))

  log.success("done", {
    url,
    niches,
    queriesRun: queryPlan.length,
    candidatesFound: cappedCandidates.length,
    candidatesAfterDrFloor: candidates.length,
    scored: scores.size,
    returned: opportunities.length,
  })

  return {
    url,
    productName,
    niches,
    queriesRun: queryPlan.length,
    found: cappedCandidates.length,
    scored: scores.size,
    highFit: opportunities.filter((opportunity) => opportunity.score >= 75).length,
    returned: opportunities.length,
    lowConfidence: false,
    opportunities,
  }
}
