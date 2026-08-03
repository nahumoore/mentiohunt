import pLimit from "p-limit"
import { SCRAPERLINK_GOOGLE_SERP, type GoogleSerpItem } from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import { extractDomainFromUrl, isNoiseDomain } from "../prospect-generation-methods/shared/url-filters.js"
import { deriveNiches } from "../guest-post-sites/derive-niches.js"
import {
  BROKEN_LINK_QUERY_TEMPLATES,
  DEFAULT_LIMITS,
  type BrokenLinkCandidate,
  type FindBrokenLinkCandidatesInput,
  type FindBrokenLinkCandidatesResult,
} from "./types.js"

const log = createLogger("find-broken-link-candidates-by-url")

type QueryPlanItem = {
  query: string
  niche: string
  footprintLabel: string
}

function buildQueryPlan(niches: string[]): QueryPlanItem[] {
  const templates = BROKEN_LINK_QUERY_TEMPLATES.slice(0, DEFAULT_LIMITS.queryTemplatesPerNiche)

  return niches.flatMap((niche) =>
    templates.map((template) => ({
      query: template.query.replace("{niche}", niche),
      niche,
      footprintLabel: template.footprintLabel,
    }))
  )
}

export async function findBrokenLinkCandidatesByUrl(
  input: FindBrokenLinkCandidatesInput
): Promise<FindBrokenLinkCandidatesResult> {
  const { url, productName, siteContext } = input
  const ownDomain = extractDomainFromUrl(url)

  log.info("discovery started", { url, productName })

  const { niches } = await deriveNiches(productName, siteContext)
  const queryPlan = buildQueryPlan(niches)

  if (queryPlan.length === 0) {
    log.warn("no query plan built", { url, niches })
    return { url, productName, niches, queriesRun: 0, candidates: [] }
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

  const candidatesByDomain = new Map<string, BrokenLinkCandidate>()
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
        matchedQuery: batch.plan.query,
        matchedFootprint: batch.plan.footprintLabel,
      })
    }
  }

  const candidates = [...candidatesByDomain.values()].slice(0, DEFAULT_LIMITS.maxCandidates)

  log.success("done", {
    url,
    niches,
    queriesRun: queryPlan.length,
    candidatesFound: candidates.length,
  })

  return {
    url,
    productName,
    niches,
    queriesRun: queryPlan.length,
    candidates,
  }
}
