import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
} from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"
import type { EmailSettings, ProspectCreatedPayload } from "../competitor-backlinks/discover-competitor-backlinks.js"
import type { FilterSettings } from "../competitor-backlinks/filter-backlinks.js"
import { fetchPageContent } from "../listicle-roundup/check-listicle-client.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { extractDomainFromUrl, isNoiseDomain } from "../shared/url-filters.js"
import { enrichDomainRatings, enrichResourceInclusion } from "./enrichment.js"
import { limitNumber, normalizeUrl, queryKey } from "./helpers.js"
import { completeProspectRun, createProspectRun, failProspectRun } from "./prospect-run-tracking.js"
import { buildQueryPlan, selectPagesForRun } from "./query-planning.js"
import { loadRunHistory } from "./run-history.js"
import {
  scoreResourcePageInclusion,
  type ResourceInclusionCandidate,
  type ScoredResourceInclusionCandidate,
  type TargetPageForInclusion,
} from "./score-resource-page-inclusion.js"
import { DEFAULT_LIMITS, DEFAULT_PAGE_TYPES, DEFAULT_QUERY_TEMPLATES, type Product, type ResourcePageInclusionOptions } from "./types.js"

const log = createLogger("discover-resource-page-inclusions")

export type { ResourcePageInclusionOptions } from "./types.js"

export async function discoverResourcePageInclusions(
  product: Product,
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  options: ResourcePageInclusionOptions = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void
): Promise<{
  prospectsCreated: number
  totalCostUsd: number
  runInput: unknown
  dryRun: boolean
  candidatesFound: number
  candidatesScored: number
}> {
  const ownDomain = extractDomainFromUrl(product.website_url)
  const maxPages = limitNumber(options.maxPages, DEFAULT_LIMITS.maxPages)
  const maxQueriesPerPage = limitNumber(options.maxQueriesPerPage, DEFAULT_LIMITS.maxQueriesPerPage)
  const maxCandidates = limitNumber(options.maxCandidates, DEFAULT_LIMITS.maxCandidates)
  const maxProspects = limitNumber(options.maxProspects, DEFAULT_LIMITS.maxProspects)
  const minPriority = limitNumber(options.minPriority, DEFAULT_LIMITS.minPriority, 0)
  const scoringThreshold = limitNumber(options.scoringThreshold, DEFAULT_LIMITS.scoringThreshold)
  const country = options.country?.trim() || DEFAULT_LIMITS.country
  const serpResultsPerQuery = options.serpResultsPerQuery ?? DEFAULT_LIMITS.serpResultsPerQuery
  const pageTypes = options.pageTypes?.length ? options.pageTypes : DEFAULT_PAGE_TYPES
  const queryTemplates = options.queryTemplates?.length ? options.queryTemplates : DEFAULT_QUERY_TEMPLATES
  const dryRun = options.dryRun === true

  log.info("discovery started", { productId: product.id, ownDomain, dryRun })

  const runHistory = await loadRunHistory(product.id)
  const explicitPageIds = (options.pageIds?.length ?? 0) > 0
  const pageFetchLimit = explicitPageIds
    ? Math.max(options.pageIds?.length ?? maxPages, maxPages)
    : Math.min(Math.max(maxPages * 5, maxPages), 50)

  let pagesQuery = supabaseAdmin
    .from("product_pages")
    .select("id, url, title, description, page_type, priority, keywords")
    .eq("product_id", product.id)
    .eq("crawl_status", "crawled")
    .gte("priority", minPriority)
    .in("page_type", pageTypes)
    .order("priority", { ascending: false })
    .limit(pageFetchLimit)

  if (options.pageIds?.length) pagesQuery = pagesQuery.in("id", options.pageIds)

  const { data: rawPages, error: pagesError } = await pagesQuery
  if (pagesError) throw new Error(`Could not load product pages: ${pagesError.message}`)

  const eligiblePages: TargetPageForInclusion[] = (rawPages ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    description: p.description,
    page_type: p.page_type,
    priority: p.priority,
    keywords: p.keywords ?? [],
  }))

  const pages = selectPagesForRun(eligiblePages, maxPages, runHistory.lastRunByPageId, explicitPageIds)

  const queryPlan = buildQueryPlan(pages, queryTemplates, maxQueriesPerPage, runHistory.lastRunByQueryKey)
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
    })),
    page_types: pageTypes,
    min_priority: minPriority,
    query_templates: queryTemplates,
    queries: queryPlan.map((q) => ({ query: q.query, target_page_id: q.targetPage.id, target_url: q.targetPage.url })),
    limits: { maxPages, maxQueriesPerPage, maxCandidates, maxProspects, serpResultsPerQuery },
    filters: { dr_min: settings.dr_min, dr_max: settings.dr_max, own_domain: ownDomain },
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
        last_run_at: runHistory.lastRunByQueryKey.get(queryKey(q.targetPage.id, q.query)) ?? null,
      })),
    },
    dry_run: dryRun,
  }

  const runId = await createProspectRun(product.id, runInput, dryRun)
  let totalCostUsd = 0

  try {
    if (pages.length === 0 || queryPlan.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, { reason: "no_eligible_pages_or_queries" })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: 0, candidatesScored: 0 }
    }

    const serpLimit = pLimit(3)
    const serpBatches = await Promise.all(
      queryPlan.map((plan) =>
        serpLimit(async () => {
          try {
            const serp = await runApifyActor<GoogleSerpItem[]>(
              SCRAPERLINK_GOOGLE_SERP,
              { keyword: plan.query, limit: serpResultsPerQuery, country, include_merged: false },
              90
            )
            return { plan, results: serp.flatMap((item) => item.results ?? []) }
          } catch (err) {
            log.warn("SERP query failed", { productId: product.id, query: plan.query, error: String(err) })
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
      await completeProspectRun(runId, 0, totalCostUsd, { candidates_gathered: 0 })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: 0, candidatesScored: 0 }
    }

    const { data: existingProspects } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url, domain")
      .eq("product_id", product.id)
      .in("domain", [...new Set(gathered.map((c) => c.domain))])

    const existingUrls = new Set((existingProspects ?? []).map((r) => r.found_url))
    const existingDomains = new Set((existingProspects ?? []).map((r) => r.domain))
    const candidates = gathered
      .filter((c) => !existingUrls.has(c.url) && !existingDomains.has(c.domain))
      .slice(0, maxCandidates)

    log.info("candidates gathered", {
      productId: product.id,
      pages: pages.length,
      queries: queryPlan.length,
      uniquePairs: gathered.length,
      alreadyStored: gathered.length - candidates.length,
      toFetch: candidates.length,
    })

    if (candidates.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, { candidates_gathered: gathered.length, already_stored: gathered.length })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: 0 }
    }

    const fetchLimit = pLimit(5)
    const fetched = await Promise.all(
      candidates.map((candidate) =>
        fetchLimit(async () => {
          const content = await fetchPageContent(candidate.url)
          return content ? { ...candidate, title: content.title || candidate.title, text: content.text } : null
        })
      )
    )
    const withContent = fetched.filter((c): c is ResourceInclusionCandidate => c !== null)

    if (withContent.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, { candidates_gathered: gathered.length, fetched: 0 })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: 0 }
    }

    const { results: scored, totalCost: scoringCost } = await scoreResourcePageInclusion(withContent, product)
    totalCostUsd += scoringCost

    const bestByDomain = new Map<string, ScoredResourceInclusionCandidate>()
    for (const item of scored) {
      if (item.relevanceScore < scoringThreshold) continue
      if (!item.isCuratedResourcePage || item.alreadyLinksToTarget) continue
      const current = bestByDomain.get(item.domain)
      if (!current || item.relevanceScore > current.relevanceScore) bestByDomain.set(item.domain, item)
    }

    let qualified = [...bestByDomain.values()]
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxProspects)

    if (qualified.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, { candidates_gathered: gathered.length, scored: scored.length, qualified: 0 })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: scored.length }
    }

    if (settings.dr_min > 0 || settings.dr_max !== null) {
      const drByDomain = await enrichDomainRatings([...new Set(qualified.map((q) => q.domain))])
      qualified = qualified
        .map((q) => ({ ...q, domainRating: drByDomain.get(q.domain) ?? null }))
        .filter((q) => {
          const dr = q.domainRating
          if (dr === null) return false
          if (dr < settings.dr_min) return false
          if (settings.dr_max !== null && dr > settings.dr_max) return false
          return true
        }) as ScoredResourceInclusionCandidate[]
    }

    const siteRelevanceInputs = qualified.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.relevanceReason || item.snippet || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } = await scoreSiteRelevance(siteRelevanceInputs, product)
    totalCostUsd += siteRelevanceCost

    const toProcess = qualified.filter(() => {
      if (budget && budget.remaining <= 0) return false
      if (budget) budget.remaining -= 1
      return true
    })

    if (dryRun) {
      await completeProspectRun(runId, 0, totalCostUsd, { dry_run: true, qualified: toProcess.length })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: scored.length }
    }

    if (toProcess.length === 0) {
      await completeProspectRun(runId, 0, totalCostUsd, { qualified: qualified.length, budget_exhausted: true })
      return { prospectsCreated: 0, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: scored.length }
    }

    const bareRows = toProcess.map((item) => {
      const sr = siteRelevanceResults.get(item.url)
      const itemWithDr = item as ScoredResourceInclusionCandidate & { domainRating?: number | null }
      return {
        product_id: product.id,
        product_page_id: item.targetPage.id,
        domain: item.domain,
        domain_rating: itemWithDr.domainRating ?? null,
        found_url: item.url,
        target_url: item.targetPage.url,
        tier: "resource_page_inclusion" as const,
        status: "new" as const,
        site_relevance_score: sr?.score ?? null,
        enrichment_status: "pending" as const,
        raw_metadata: {
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
    })

    const { data: insertedRows, error: insertError } = await supabaseAdmin
      .from("backlink_prospects")
      .upsert(bareRows, { onConflict: "product_id,found_url", ignoreDuplicates: true })
      .select("id, found_url")

    if (insertError) throw new Error(`bare prospect insert failed: ${insertError.message}`)

    const idByUrl = new Map((insertedRows ?? []).map((r) => [r.found_url as string, r.id as string]))
    const prospectsCreated = idByUrl.size
    const sender = await resolveSenderName(product.user_id)
    const enrichLimit = pLimit(3)

    await Promise.allSettled(
      toProcess
        .filter((item) => idByUrl.has(item.url))
        .map((item) =>
          enrichLimit(async () => {
            const id = idByUrl.get(item.url)!
            await supabaseAdmin
              .from("backlink_prospects")
              .update({ enrichment_status: "enriching" as const })
              .eq("id", id)

            const enriched = await enrichResourceInclusion(item, product, sender, emailSettings)
            const { step2_body, step3_body, ...dbEnriched } = enriched
            const ready = !!enriched.contact_email
            const { error } = await supabaseAdmin
              .from("backlink_prospects")
              .update({
                ...dbEnriched,
                enrichment_status: ready ? ("ready" as const) : ("failed" as const),
                status: ready ? ("new" as const) : ("email_not_found" as const),
              })
              .eq("id", id)

            if (error) {
              log.warn("prospect enrichment update failed", { domain: item.domain, error: error.message })
              return
            }

            if (ready) {
              onProspectCreated?.({
                id,
                contactName: enriched.contact_name,
                emailSubject: enriched.email_subject,
                emailBody: enriched.email_body,
                step2Body: step2_body,
                step3Body: step3_body,
              })
            }
          })
        )
    )

    await completeProspectRun(runId, prospectsCreated, totalCostUsd, {
      candidates_gathered: gathered.length,
      candidates_fetched: withContent.length,
      candidates_scored: scored.length,
      qualified: qualified.length,
    })

    return { prospectsCreated, totalCostUsd, runInput, dryRun, candidatesFound: gathered.length, candidatesScored: scored.length }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    await failProspectRun(runId, msg)
    throw err
  }
}
