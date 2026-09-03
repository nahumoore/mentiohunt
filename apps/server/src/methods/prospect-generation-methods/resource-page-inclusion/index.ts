import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
} from "../../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../../helpers/logger.js"
import type { FilterSettings } from "../competitor-backlink/filter-backlinks.js"
import { fetchPageContent } from "../listicle-roundup/check-listicle-client.js"
import { persistAndEnrich } from "../shared/persist-and-enrich.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import type {
  EmailSettings,
  ProspectCreatedPayload,
} from "../shared/prospect-types.js"
import {
  emptyStrategyFunnel,
  type StrategyResult,
} from "../shared/strategy-result.js"
import {
  claimDiscoveryCandidates,
  completeDiscoveryCandidates,
  retryDiscoveryCandidates,
  storeDiscoveryCandidates,
} from "../shared/discovery-candidate-backlog.js"
import { extractDomainFromUrl, isNoiseDomain } from "../shared/url-filters.js"
import { enrichResourceInclusion } from "./enrichment.js"
import { filterCandidatesByDrRange } from "../shared/enrich-domain-ratings.js"
import { limitNumber, normalizeUrl, queryKey } from "./helpers.js"
import {
  completeProspectRun,
  createProspectRun,
  failProspectRun,
} from "./prospect-run-tracking.js"
import { buildQueryPlan, selectPagesForRun } from "./query-planning.js"
import { loadRunHistory } from "./run-history.js"
import {
  scoreResourcePageInclusion,
  type ResourceInclusionCandidate,
  type ScoredResourceInclusionCandidate,
  type TargetPageForInclusion,
} from "./score-resource-page-inclusion.js"
import {
  DEFAULT_LIMITS,
  DEFAULT_QUERY_TEMPLATES,
  type Product,
  type ResourcePageInclusionOptions,
} from "./types.js"

const log = createLogger("discover-resource-page-inclusions")

export type { ResourcePageInclusionOptions } from "./types.js"

export async function discoverResourcePageInclusions(
  product: Product,
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  options: ResourcePageInclusionOptions = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  enrichmentBudget?: { remaining: number }
): Promise<
  StrategyResult & {
    runInput: unknown
    dryRun: boolean
    candidatesFound: number
    candidatesScored: number
  }
> {
  const ownDomain = extractDomainFromUrl(product.website_url)
  const maxPages = limitNumber(options.maxPages, DEFAULT_LIMITS.maxPages)
  const maxQueriesPerPage = limitNumber(
    options.maxQueriesPerPage,
    DEFAULT_LIMITS.maxQueriesPerPage
  )
  const maxCandidates = limitNumber(
    options.maxCandidates,
    DEFAULT_LIMITS.maxCandidates
  )
  const maxProspects = limitNumber(
    options.maxProspects,
    DEFAULT_LIMITS.maxProspects
  )
  const maxPriority = limitNumber(
    options.maxPriority,
    DEFAULT_LIMITS.maxPriority
  )
  const scoringThreshold = limitNumber(
    options.scoringThreshold,
    DEFAULT_LIMITS.scoringThreshold
  )
  const country = options.country?.trim() || DEFAULT_LIMITS.country
  const serpResultsPerQuery =
    options.serpResultsPerQuery ?? DEFAULT_LIMITS.serpResultsPerQuery
  // Page type is no longer a hard filter by default — keyword relevance
  // (is_target, set by crawlProductPages's top-N selection) is a strictly
  // better "is this a plausible link target" signal than page type, which
  // was only ever a proxy for it. pageTypes stays available as an explicit
  // override for callers that want it (e.g. the free tool).
  const pageTypes = options.pageTypes?.length ? options.pageTypes : null
  const queryTemplates = options.queryTemplates?.length
    ? options.queryTemplates
    : DEFAULT_QUERY_TEMPLATES
  const dryRun = options.dryRun === true

  log.info("discovery started", { productId: product.id, ownDomain, dryRun })

  const runHistory = await loadRunHistory(product.id)
  const explicitPageIds = (options.pageIds?.length ?? 0) > 0
  const pageFetchLimit = explicitPageIds
    ? Math.max(options.pageIds?.length ?? maxPages, maxPages)
    : Math.min(Math.max(maxPages * 5, maxPages), 50)

  let pagesQuery = supabaseAdmin
    .from("product_pages")
    .select(
      "id, url, title, description, page_type, priority, keywords, matched_keywords"
    )
    .eq("product_id", product.id)
    .eq("crawl_status", "crawled")
    .eq("is_target", true)
    .lte("priority", maxPriority)
    .order("priority", { ascending: true })
    .limit(pageFetchLimit)

  if (pageTypes) pagesQuery = pagesQuery.in("page_type", pageTypes)
  if (options.pageIds?.length) pagesQuery = pagesQuery.in("id", options.pageIds)

  const { data: rawPages, error: pagesError } = await pagesQuery
  if (pagesError)
    throw new Error(`Could not load product pages: ${pagesError.message}`)

  const eligiblePages: TargetPageForInclusion[] = (rawPages ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    description: p.description,
    page_type: p.page_type,
    priority: p.priority,
    keywords: p.keywords ?? [],
    matched_keywords: p.matched_keywords ?? [],
  }))

  const pages = selectPagesForRun(
    eligiblePages,
    maxPages,
    runHistory.lastRunByPageId,
    explicitPageIds
  )

  const queryPlan = buildQueryPlan(
    pages,
    queryTemplates,
    maxQueriesPerPage,
    runHistory.lastRunByQueryKey,
    product.target_keywords ?? []
  )
  const runInput = {
    product_id: product.id,
    opportunity_type: "resource_page_inclusion",
    target_page_ids: pages.map((p) => p.id),
    selected_pages: pages.map((p) => ({
      id: p.id,
      url: p.url,
      title: p.title,
      page_type: p.page_type,
      priority: p.priority,
      keywords: p.keywords,
      matched_keywords: p.matched_keywords,
    })),
    product_target_keywords: product.target_keywords ?? [],
    page_types: pageTypes,
    max_priority: maxPriority,
    query_templates: queryTemplates,
    queries: queryPlan.map((q) => ({
      query: q.query,
      target_page_id: q.targetPage.id,
      target_url: q.targetPage.url,
    })),
    limits: {
      maxPages,
      maxQueriesPerPage,
      maxCandidates,
      maxProspects,
      serpResultsPerQuery,
    },
    filters: {
      dr_min: settings.dr_min,
      dr_max: settings.dr_max,
      own_domain: ownDomain,
    },
    scoring_threshold: scoringThreshold,
    country,
    run_history: {
      runs_considered: runHistory.runsConsidered,
      eligible_pages_loaded: eligiblePages.length,
      page_fetch_limit: pageFetchLimit,
      explicit_page_ids: explicitPageIds,
      selected_pages_with_last_run: pages.map((p) => ({
        id: p.id,
        last_run_at: runHistory.lastRunByPageId.get(p.id) ?? null,
      })),
      selected_queries_with_last_run: queryPlan.map((q) => ({
        query: q.query,
        target_page_id: q.targetPage.id,
        last_run_at:
          runHistory.lastRunByQueryKey.get(
            queryKey(q.targetPage.id, q.query)
          ) ?? null,
      })),
    },
    dry_run: dryRun,
  }

  const runId = await createProspectRun(product.id, runInput, dryRun)
  let totalCostUsd = 0

  try {
    if (pages.length === 0 || queryPlan.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        reason: "no_eligible_pages_or_queries",
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: 0,
        candidatesScored: 0,
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
                limit: serpResultsPerQuery,
                country,
                include_merged: false,
              },
              90
            )
            return { plan, results: serp.flatMap((item) => item.results ?? []) }
          } catch (err) {
            log.warn("SERP query failed", {
              productId: product.id,
              query: plan.query,
              error: String(err),
            })
            return { plan, results: [] }
          }
        })
      )
    )

    const candidatePairs = new Map<string, ResourceInclusionCandidate>()
    for (const batch of serpBatches) {
      for (const result of batch.results) {
        if (!result.url) continue
        const normalizedUrl = normalizeUrl(result.url)
        const domain = extractDomainFromUrl(normalizedUrl)
        if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue
        const id = `${normalizedUrl}::${batch.plan.targetPage.id}`
        if (candidatePairs.has(id)) continue
        candidatePairs.set(id, {
          id,
          url: normalizedUrl,
          domain,
          title: result.title ?? "",
          snippet: result.description ?? "",
          text: "",
          query: batch.plan.query,
          targetPage: batch.plan.targetPage,
        })
      }
    }

    const gathered = [...candidatePairs.values()]
    if (gathered.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        candidates_gathered: 0,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: 0,
        candidatesScored: 0,
      }
    }

    const { data: existingProspects } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url, domain")
      .eq("product_id", product.id)
      .in("domain", [...new Set(gathered.map((c) => c.domain))])

    const existingUrls = new Set(
      (existingProspects ?? []).map((r) => r.found_url)
    )
    const existingDomains = new Set(
      (existingProspects ?? []).map((r) => r.domain)
    )
    const freshCandidates = gathered.filter(
      (c) => !existingUrls.has(c.url) && !existingDomains.has(c.domain)
    )
    await storeDiscoveryCandidates(
      product.id,
      "resource_page_inclusion",
      freshCandidates.map((candidate, index) => ({
        candidateKey: candidate.id,
        url: candidate.url,
        domain: candidate.domain,
        title: candidate.title,
        snippet: candidate.snippet,
        query: candidate.query,
        targetPageId: candidate.targetPage.id,
        targetUrl: candidate.targetPage.url,
        priorityScore: freshCandidates.length - index,
        metadata: { targetPage: candidate.targetPage },
      }))
    )
    // Claim/slice a wider pre-DR pool than maxCandidates — the DR filter
    // below drops out-of-range domains before any page fetch or LLM score.
    const preDrCap = maxCandidates * 2
    const claimed = await claimDiscoveryCandidates(
      product.id,
      "resource_page_inclusion",
      preDrCap
    )
    type ResourceBacklogCandidate = ResourceInclusionCandidate & {
      backlogId: string | null
    }
    const candidatesPreDr: ResourceBacklogCandidate[] =
      claimed.length > 0
        ? claimed.flatMap((candidate) => {
            const targetPage = candidate.metadata?.targetPage as
              | TargetPageForInclusion
              | undefined
            if (!targetPage) return []
            return [
              {
                id: candidate.candidateKey,
                url: candidate.url,
                domain: candidate.domain,
                title: candidate.title ?? "",
                snippet: candidate.snippet ?? "",
                text: "",
                query: candidate.query ?? "",
                targetPage,
                backlogId: candidate.id,
              },
            ]
          })
        : freshCandidates
            .slice(0, preDrCap)
            .map((candidate) => ({ ...candidate, backlogId: null }))

    log.info("candidates gathered", {
      productId: product.id,
      pages: pages.length,
      queries: queryPlan.length,
      uniquePairs: gathered.length,
      alreadyStored: gathered.length - freshCandidates.length,
      preDrPool: candidatesPreDr.length,
    })

    if (candidatesPreDr.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        candidates_gathered: gathered.length,
        already_stored: gathered.length,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: 0,
      }
    }

    // Domain rating — resolved and filtered before any page fetch or LLM
    // score. Keeps unknown-DR domains (no Ahrefs data yet, or lookup
    // failure) rather than discarding them — unlike listicle/mention, this
    // strategy has always treated an unresolved rating as "don't discard",
    // and that stays true here.
    const drFiltered = await filterCandidatesByDrRange(
      candidatesPreDr,
      (c) => c.domain,
      settings,
      { keepUnknown: true }
    )
    log.info("dr filter applied (pre-fetch)", {
      productId: product.id,
      dr_min: settings.dr_min,
      dr_max: settings.dr_max,
      before: candidatesPreDr.length,
      outOfRange: drFiltered.outOfRange,
      unresolved: drFiltered.unresolved,
      kept: drFiltered.kept.length,
    })

    const candidates = drFiltered.kept.slice(0, maxCandidates)

    if (candidates.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        candidates_gathered: gathered.length,
        already_stored: gathered.length,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: 0,
      }
    }

    const fetchLimit = pLimit(8)
    const fetched = await Promise.all(
      candidates.map((candidate) =>
        fetchLimit(async () => {
          const content = await fetchPageContent(candidate.url)
          return content
            ? {
                ...candidate,
                title: content.title || candidate.title,
                text: content.text,
              }
            : null
        })
      )
    )
    const withContent = fetched.filter(
      (c): c is (typeof candidates)[number] => c !== null
    )
    const failedBacklogIds = candidates
      .filter(
        (candidate, index) => fetched[index] === null && candidate.backlogId
      )
      .map((candidate) => candidate.backlogId as string)
    await retryDiscoveryCandidates(failedBacklogIds, "page_fetch_failed")

    if (withContent.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        candidates_gathered: gathered.length,
        fetched: 0,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: 0,
      }
    }

    const { results: scored, totalCost: scoringCost } =
      await scoreResourcePageInclusion(withContent, product)
    totalCostUsd += scoringCost
    await completeDiscoveryCandidates(
      withContent
        .map(
          (candidate) =>
            (candidate as ResourceInclusionCandidate & { backlogId?: string })
              .backlogId
        )
        .filter((id): id is string => Boolean(id))
    )

    const bestByDomain = new Map<string, ScoredResourceInclusionCandidate>()
    for (const item of scored) {
      if (item.relevanceScore < scoringThreshold) continue
      if (!item.isCuratedResourcePage || item.alreadyLinksToTarget) continue
      const current = bestByDomain.get(item.domain)
      if (!current || item.relevanceScore > current.relevanceScore)
        bestByDomain.set(item.domain, item)
    }

    const qualified = [...bestByDomain.values()]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxProspects)

    if (qualified.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        candidates_gathered: gathered.length,
        scored: scored.length,
        qualified: 0,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: scored.length,
      }
    }

    // Domain rating was already resolved and filtered pre-fetch, above —
    // it's carried through via the untyped `domainRating` field that
    // survived scoreResourcePageInclusion's `{...item, ...}` spread (see the
    // `itemWithDr` cast in buildBareRow below), so there's nothing left to
    // do here.

    const siteRelevanceInputs = qualified.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.relevanceReason || item.snippet || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } =
      await scoreSiteRelevance(siteRelevanceInputs, product)
    totalCostUsd += siteRelevanceCost

    if (dryRun) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        dry_run: true,
        qualified: qualified.length,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: scored.length,
      }
    }

    if (qualified.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, {
        qualified: qualified.length,
        budget_exhausted: true,
      })
      return {
        prospectsCreated: 0,
        totalCostUsd,
        runInput,
        dryRun,
        candidatesFound: gathered.length,
        candidatesScored: scored.length,
      }
    }

    const sender = await resolveSenderName(product.user_id)
    const enrichLimit = pLimit(5)
    const persistence = await persistAndEnrich({
      productId: product.id,
      candidates: qualified.map((item) => ({
        item,
        foundUrl: item.url,
        domain: item.domain,
      })),
      budget,
      enrichmentBudget,
      enrichLimit,
      buildBareRow: ({ item, domain }) => {
        const sr = siteRelevanceResults.get(item.url)
        const itemWithDr = item as ScoredResourceInclusionCandidate & {
          domainRating?: number | null
        }
        return {
          product_id: product.id,
          product_page_id: item.targetPage.id,
          domain,
          domain_rating: itemWithDr.domainRating ?? null,
          found_url: item.url,
          target_url: item.targetPage.url,
          tier: "resource_page_inclusion" as const,
          status: "new" as const,
          site_relevance_score: sr?.score ?? null,
          enrichment_status: "pending" as const,
          raw_metadata: {
            outreach_context: {
              opportunityType: "resource_page_inclusion",
              title: item.title,
              foundUrl: item.url,
              targetUrl: item.targetPage.url,
              targetTitle: item.targetPage.title ?? "",
              targetDescription: item.targetPage.description,
              targetPageType: item.targetPage.page_type,
              reason: item.relevanceReason,
            },
            resource_page_inclusion: {
              targetPageId: item.targetPage.id,
              targetPageType: item.targetPage.page_type,
              targetTitle: item.targetPage.title,
              targetKeywords: item.targetPage.keywords,
              query: item.query,
              relevanceScore: item.relevanceScore,
              relevanceReason: item.relevanceReason,
            },
          },
        }
      },
      enrich: ({ item }) =>
        enrichResourceInclusion(item, product, sender, emailSettings),
      onProspectCreated,
      logContext: { strategy: "resource_page_inclusion" },
    })
    const prospectsCreated = persistence.prospectsInserted
    const enrichedWithContact = persistence.contactReady

    await completeProspectRun(runId, prospectsCreated, totalCostUsd, {
      candidates_gathered: gathered.length,
      candidates_fetched: withContent.length,
      candidates_scored: scored.length,
      qualified: qualified.length,
      enriched_with_contact: enrichedWithContact,
    })

    return {
      prospectsCreated,
      totalCostUsd,
      runInput,
      dryRun,
      candidatesFound: gathered.length,
      candidatesScored: scored.length,
      funnel: emptyStrategyFunnel({
        candidatesGathered: gathered.length,
        candidatesFetched: withContent.length,
        candidatesQualified: qualified.length,
        enrichmentAttempts: persistence.enrichmentAttempts,
        prospectsInserted: persistence.prospectsInserted,
        contactReady: persistence.contactReady,
        emailNotFound: persistence.emailNotFound,
        enrichmentFailures: persistence.enrichmentFailures,
        persistenceFailures: persistence.persistenceFailures,
        callbackFailures: persistence.callbackFailures,
        duplicatesSkipped: persistence.duplicatesSkipped,
        budgetSkipped: persistence.budgetSkipped,
        exhausted: gathered.length < maxCandidates,
      }),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    await failProspectRun(runId, msg)
    throw err
  }
}
