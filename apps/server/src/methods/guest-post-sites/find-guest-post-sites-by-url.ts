import pLimit from "p-limit"
import { SCRAPERLINK_GOOGLE_SERP, type GoogleSerpItem } from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import { extractDomainFromUrl, isNoiseDomain } from "../prospect-generation-methods/shared/url-filters.js"
import { scoreSiteRelevance } from "../prospect-generation-methods/shared/score-site-relevance.js"
import { deriveNiches } from "./derive-niches.js"
import {
  DEFAULT_LIMITS,
  GUEST_POST_QUERY_TEMPLATES,
  type FindGuestPostSitesInput,
  type FindGuestPostSitesResult,
  type GuestPostSiteResult,
} from "./types.js"

const log = createLogger("find-guest-post-sites-by-url")

type QueryPlanItem = {
  query: string
  niche: string
  footprintLabel: string
}

type Candidate = {
  id: string
  domain: string
  url: string
  title: string
  snippet: string
  query: string
  footprintLabel: string
}

function buildQueryPlan(niches: string[]): QueryPlanItem[] {
  const templates = GUEST_POST_QUERY_TEMPLATES.slice(0, DEFAULT_LIMITS.queryTemplatesPerNiche)

  return niches.flatMap((niche) =>
    templates.map((template) => ({
      query: template.query.replace("{niche}", niche),
      niche,
      footprintLabel: template.footprintLabel,
    }))
  )
}

export async function findGuestPostSitesByUrl(
  input: FindGuestPostSitesInput
): Promise<FindGuestPostSitesResult> {
  const { url, productName, siteContext } = input
  const ownDomain = extractDomainFromUrl(url)

  log.info("discovery started", { url, productName })

  const { niches, cost: nicheCost } = await deriveNiches(productName, siteContext)
  const queryPlan = buildQueryPlan(niches)

  if (queryPlan.length === 0) {
    log.warn("no query plan built", { url, niches })
    return { url, productName, niches, queriesRun: 0, found: 0, scored: 0, sites: [] }
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
      const domain = extractDomainFromUrl(result.url)
      if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue
      // Keep the first (highest-ranked) match per domain across all queries.
      if (candidatesByDomain.has(domain)) continue

      candidatesByDomain.set(domain, {
        id: domain,
        domain,
        url: result.url,
        title: result.title ?? "",
        snippet: result.description ?? "",
        query: batch.plan.query,
        footprintLabel: batch.plan.footprintLabel,
      })
    }
  }

  const candidates = [...candidatesByDomain.values()].slice(0, DEFAULT_LIMITS.maxCandidates)

  log.info("candidates gathered", {
    url,
    queries: queryPlan.length,
    uniqueDomains: candidates.length,
  })

  if (candidates.length === 0) {
    return { url, productName, niches, queriesRun: queryPlan.length, found: 0, scored: 0, sites: [] }
  }

  const { results: scores, cost: scoringCost } = await scoreSiteRelevance(
    candidates.map((c) => ({ id: c.id, domain: c.domain, title: c.title, snippet: c.snippet })),
    { product_name: productName, product_description: siteContext?.metaDescription ?? productName }
  )

  const sites: GuestPostSiteResult[] = candidates
    .map((c) => {
      const score = scores.get(c.id)?.score ?? 0
      return {
        domain: c.domain,
        name: c.title || c.domain,
        url: c.url,
        score,
        reason: c.snippet || "Publicly invites guest contributions in this topic area.",
        matchedQuery: c.query,
        matchedFootprint: c.footprintLabel,
      }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, DEFAULT_LIMITS.maxSites)

  log.success("done", {
    url,
    niches,
    queriesRun: queryPlan.length,
    candidatesFound: candidates.length,
    scored: scores.size,
    returned: sites.length,
    cost_usd: (nicheCost + scoringCost).toFixed(4),
  })

  return {
    url,
    productName,
    niches,
    queriesRun: queryPlan.length,
    found: candidates.length,
    scored: scores.size,
    sites,
  }
}
