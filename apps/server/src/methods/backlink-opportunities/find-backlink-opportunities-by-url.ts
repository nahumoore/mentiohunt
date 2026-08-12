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

type Candidate = {
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

export async function findBacklinkOpportunitiesByUrl(
  input: FindBacklinkOpportunitiesInput
): Promise<FindBacklinkOpportunitiesResult> {
  const { url, productName, siteContext } = input
  const ownDomain = extractDomainFromUrl(url)

  log.info("discovery started", { url, productName })

  const { niches } = await deriveNiches(productName, siteContext)
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
      // Keep the first (highest-ranked) page for each domain so the results
      // are a useful outreach list rather than several URLs from one site.
      if (candidatesByDomain.has(domain)) continue

      candidatesByDomain.set(domain, {
        id: domain,
        domain,
        url: normalizedUrl,
        title: result.title ?? "",
        snippet: result.description ?? "",
        niche: batch.plan.niche,
        query: batch.plan.query,
        footprintLabel: batch.plan.footprintLabel,
        type: batch.plan.type,
      })
    }
  }

  const candidates = [...candidatesByDomain.values()].slice(0, DEFAULT_LIMITS.maxCandidates)
  if (candidates.length === 0) {
    return {
      url,
      productName,
      niches,
      queriesRun: queryPlan.length,
      found: 0,
      scored: 0,
      highFit: 0,
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
      product_name: productName,
      product_description: siteContext?.metaDescription ?? productName,
    }
  )

  const scoredCandidates = candidates
    .map((candidate) => ({ candidate, score: scores.get(candidate.id)?.score ?? 0 }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_LIMITS.maxOpportunities)

  const drByDomain = await enrichDomainRatings([
    ...new Set(scoredCandidates.map(({ candidate }) => candidate.domain)),
  ])

  const opportunities = scoredCandidates.map(({ candidate, score }, index) => ({
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
    candidatesFound: candidates.length,
    scored: scores.size,
    returned: opportunities.length,
  })

  return {
    url,
    productName,
    niches,
    queriesRun: queryPlan.length,
    found: candidates.length,
    scored: scores.size,
    highFit: opportunities.filter((opportunity) => opportunity.score >= 75).length,
    opportunities,
  }
}
