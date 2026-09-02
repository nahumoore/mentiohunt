import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
} from "../../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../../helpers/logger.js"
import type { FilterSettings } from "../competitor-backlink/filter-backlinks.js"
import { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"
import { persistAndEnrich } from "../shared/persist-and-enrich.js"
import type {
  EmailSettings,
  ProspectCreatedPayload,
} from "../shared/prospect-types.js"
import {
  emptyStrategyFunnel,
  type StrategyResult,
} from "../shared/strategy-result.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import {
  claimDiscoveryCandidates,
  completeDiscoveryCandidates,
  retryDiscoveryCandidates,
  storeDiscoveryCandidates,
} from "../shared/discovery-candidate-backlog.js"
import { extractDomainFromUrl, isNoiseDomain } from "../shared/url-filters.js"
import { buildListicleQueries } from "./build-listicle-queries.js"
import { fetchPageContent } from "./check-listicle-client.js"
import {
  enrichListicle,
  type Product,
  type QualifiedListicle,
} from "./enrichment.js"
import {
  completeProspectRun,
  createProspectRun,
  failProspectRun,
  selectQueriesForRun,
} from "./prospect-run-tracking.js"
import { scoreListicleRelevance } from "./score-listicle-relevance.js"

const log = createLogger("discover-listicle-roundups")

const MIN_RELEVANCE_SCORE = 3
const MAX_CANDIDATES_TO_FETCH = 25
const MAX_PROSPECTS_PER_RUN = 15
const MAX_QUERIES_PER_RUN = 6
const SERP_RESULTS_PER_QUERY = "50"

export async function discoverListicleRoundups(
  product: Product,
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  limits: { maxCandidates?: number; maxProspects?: number } = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  enrichmentBudget?: { remaining: number }
): Promise<StrategyResult> {
  const maxCandidates = limits.maxCandidates ?? MAX_CANDIDATES_TO_FETCH
  const maxProspects = limits.maxProspects ?? MAX_PROSPECTS_PER_RUN
  const ownDomain = extractDomainFromUrl(product.website_url)
  const productName = product.product_name?.trim() ?? ""

  log.info("discovery started", {
    productId: product.id,
    ownDomain,
    productName,
  })

  if (!ownDomain || !productName) {
    log.info("missing domain or product name, skipping", {
      productId: product.id,
    })
    const runId = await createProspectRun(product.id, [])
    if (runId)
      await completeProspectRun(runId, 0, 0, {
        skip_reason: "missing_domain_or_name",
      })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)
  const funnel: Record<string, unknown> = {}

  let totalCostUsd = 0
  let serpFailures = 0

  const {
    queries: queryPool,
    cost: queryBuildCost,
    weightByQuery,
  } = await buildListicleQueries(product)
  totalCostUsd += queryBuildCost

  if (queryPool.length === 0) {
    log.info("no queries built, skipping", { productId: product.id })
    const runId = await createProspectRun(product.id, [])
    if (runId)
      await completeProspectRun(runId, 0, totalCostUsd, {
        skip_reason: "no_queries_built",
      })
    return { prospectsCreated: 0, totalCostUsd }
  }

  const queries = await selectQueriesForRun(
    product.id,
    queryPool,
    MAX_QUERIES_PER_RUN,
    weightByQuery
  )

  log.info("queries selected for run", {
    productId: product.id,
    poolSize: queryPool.length,
    selected: queries.length,
  })

  const runId = await createProspectRun(product.id, queries)

  try {
    // 1. SERP discovery — one query per category/competitor angle.
    const serpLimit = pLimit(3)
    const serpBatches = await Promise.all(
      queries.map((keyword) =>
        serpLimit(async () => {
          try {
            return await runApifyActor<GoogleSerpItem[]>(
              SCRAPERLINK_GOOGLE_SERP,
              {
                keyword,
                limit: SERP_RESULTS_PER_QUERY,
                country: "US",
                include_merged: false,
              },
              90
            )
          } catch (err) {
            serpFailures += 1
            log.warn("SERP query failed", {
              productId: product.id,
              keyword,
              error: String(err),
            })
            return []
          }
        })
      )
    )
    const serpResults = serpBatches.flatMap((batch) =>
      batch.flatMap((item) => item.results ?? [])
    )

    // 2. Dedup by URL, drop own domain + noise/aggregator domains.
    const byUrl = new Map<
      string,
      {
        url: string
        domain: string
        title: string
        snippet: string
        appearances: number
      }
    >()
    for (const r of serpResults) {
      if (!r.url) continue
      const domain = extractDomainFromUrl(r.url)
      if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue
      const normalizedUrl = r.url.replace(/\/$/, "")
      const existing = byUrl.get(normalizedUrl)
      if (existing) {
        existing.appearances += 1
        continue
      }
      byUrl.set(normalizedUrl, {
        url: r.url,
        domain,
        title: r.title ?? "",
        snippet: r.description ?? "",
        appearances: 1,
      })
    }
    if (byUrl.size === 0) {
      log.info("candidates gathered", {
        productId: product.id,
        queries: queries.length,
        serpResults: serpResults.length,
        uniqueUrls: 0,
        toFetch: 0,
      })
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          candidates_gathered: 0,
          qualified: 0,
          serp_failures: serpFailures,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 2b. Drop candidates we've already stored — before spending on fetch/score,
    // not after. Query rotation means most URLs seen again are ones we already have.
    const { data: existingProspects } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url, domain")
      .eq("product_id", product.id)
      .in("domain", [...new Set([...byUrl.values()].map((c) => c.domain))])

    const existingUrls = new Set(
      (existingProspects ?? []).map((r) => r.found_url)
    )
    const existingDomains = new Set(
      (existingProspects ?? []).map((r) => r.domain)
    )
    const freshDomains = new Set<string>()
    const freshCandidates = [...byUrl.values()].filter((candidate) => {
      if (
        existingUrls.has(candidate.url) ||
        existingDomains.has(candidate.domain) ||
        freshDomains.has(candidate.domain)
      )
        return false
      freshDomains.add(candidate.domain)
      return true
    })
    await storeDiscoveryCandidates(
      product.id,
      "listicle_roundup",
      freshCandidates.map((candidate, index) => ({
        candidateKey: candidate.url.replace(/\/$/, ""),
        ...candidate,
        priorityScore:
          candidate.appearances * 100 + freshCandidates.length - index,
        metadata: { query_appearances: candidate.appearances },
      }))
    )
    const claimed = await claimDiscoveryCandidates(
      product.id,
      "listicle_roundup",
      maxCandidates
    )
    const candidates =
      claimed.length > 0
        ? claimed.map((candidate) => ({
            url: candidate.url,
            domain: candidate.domain,
            title: candidate.title ?? "",
            snippet: candidate.snippet ?? "",
            backlogId: candidate.id,
          }))
        : freshCandidates
            .slice(0, maxCandidates)
            .map((candidate) => ({ ...candidate, backlogId: null }))

    log.info("candidates gathered", {
      productId: product.id,
      queries: queries.length,
      serpResults: serpResults.length,
      uniqueUrls: byUrl.size,
      alreadyStored: byUrl.size - freshCandidates.length,
      toFetch: candidates.length,
    })
    funnel.candidates_gathered = byUrl.size
    funnel.after_dedupe = freshCandidates.length
    funnel.serp_failures = serpFailures

    if (candidates.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 3. Fetch page body so the LLM can judge if it's a real, current listicle.
    // Tally why each fetch resolved so we can see per-run how many candidates
    // are lost and to what (client timeout vs server 502/CF block vs other) —
    // safe to mutate across the concurrent callbacks since Node runs them on a
    // single thread with no await between the read and write.
    const fetchLimit = pLimit(5)
    const outcomeCounts: Record<string, number> = {}
    const fetched = await Promise.all(
      candidates.map((c) =>
        fetchLimit(async () => {
          const content = await fetchPageContent(c.url, (o) => {
            outcomeCounts[o] = (outcomeCounts[o] ?? 0) + 1
          })
          return { candidate: c, content }
        })
      )
    )

    const withContent = fetched.filter(
      (
        f
      ): f is {
        candidate: (typeof candidates)[number]
        content: NonNullable<(typeof f)["content"]>
      } => f.content !== null
    )
    const failedBacklogIds = fetched
      .filter((item) => item.content === null && item.candidate.backlogId)
      .map((item) => item.candidate.backlogId as string)
    await retryDiscoveryCandidates(failedBacklogIds, "page_fetch_failed")
    log.info("content fetched", {
      productId: product.id,
      attempted: fetched.length,
      fetched: withContent.length,
      outcomes: outcomeCounts,
    })
    funnel.after_fetch = withContent.length
    funnel.fetch_outcomes = outcomeCounts

    if (withContent.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 4. Relevance scoring — genuine listicle in-category, product not yet listed.
    const { results: scored, totalCost: scoringCost } =
      await scoreListicleRelevance(
        withContent.map((f) => ({
          url: f.candidate.url,
          title: f.content.title || f.candidate.title,
          text: f.content.text,
        })),
        product
      )
    await completeDiscoveryCandidates(
      withContent
        .map((item) => item.candidate.backlogId)
        .filter((id): id is string => Boolean(id))
    )
    totalCostUsd += scoringCost

    const contentByUrl = new Map(
      withContent.map((f) => [f.candidate.url, f.candidate])
    )
    let qualified: QualifiedListicle[] = scored
      .filter((s) => s.relevanceScore >= MIN_RELEVANCE_SCORE)
      .map((s) => {
        const candidate = contentByUrl.get(s.url)!
        return {
          ...s,
          domain: candidate.domain,
          domainRating: null,
        }
      })
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxProspects)

    log.info("relevance filter", {
      productId: product.id,
      scored: scored.length,
      qualified: qualified.length,
    })
    funnel.after_scoring = qualified.length

    if (qualified.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 5. Domain rating — only when the user has set a DR floor.
    if (settings.dr_min > 0) {
      const drByDomain = await enrichDomainRatings([
        ...new Set(qualified.map((q) => q.domain)),
      ])
      qualified = qualified
        .map((q) => ({ ...q, domainRating: drByDomain.get(q.domain) ?? null }))
        .filter((q) => {
          const dr = q.domainRating
          if (dr === null) return false
          if (dr < settings.dr_min) return false
          if (settings.dr_max !== null && dr > settings.dr_max) return false
          return true
        })
      log.info("dr filter applied", {
        productId: product.id,
        dr_min: settings.dr_min,
        kept: qualified.length,
      })
      funnel.after_dr = qualified.length
    }

    if (qualified.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // Already-known URLs were filtered out at step 2b, before fetch/score, so
    // everything that survives scoring + DR filtering is new.
    const newItems = qualified

    if (newItems.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 6. Score site-level relevance for new items.
    const siteRelevanceInputs = newItems.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.relevanceReason || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } =
      await scoreSiteRelevance(siteRelevanceInputs, product)
    totalCostUsd += siteRelevanceCost

    const enrichLimit = pLimit(5)
    const persistence = await persistAndEnrich({
      productId: product.id,
      candidates: newItems.map((item) => ({
        item,
        foundUrl: item.url,
        domain: item.domain,
      })),
      budget,
      enrichmentBudget,
      enrichLimit,
      buildBareRow: ({ item, domain }) => {
        const sr = siteRelevanceResults.get(item.url)
        return {
          product_id: product.id,
          domain,
          domain_rating: item.domainRating,
          found_url: item.url,
          target_url: product.website_url,
          tier: "listicle_roundup" as const,
          status: "new" as const,
          site_relevance_score: sr?.score ?? null,
          enrichment_status: "pending" as const,
          raw_metadata: {
            outreach_context: {
              opportunityType: "listicle_roundup",
              title: item.title,
              anchor: "",
              pageType: "roundup",
              competitorDomain: item.topCompetitor ?? "similar tools",
              competitorNamedInText: true,
            },
          },
        }
      },
      enrich: ({ item }) =>
        enrichListicle(item, product, sender, emailSettings),
      onProspectCreated,
      logContext: { strategy: "listicle_roundup" },
    })
    const prospectsCreated = persistence.prospectsInserted
    const enrichedWithContact = persistence.contactReady

    log.info("rows upserted", {
      productId: product.id,
      inserted: prospectsCreated,
    })

    if (runId)
      await completeProspectRun(runId, prospectsCreated, totalCostUsd, {
        ...funnel,
        qualified: newItems.length,
        enriched_with_contact: enrichedWithContact,
      })
    return {
      prospectsCreated,
      totalCostUsd,
      funnel: emptyStrategyFunnel({
        candidatesGathered: candidates.length,
        candidatesFetched: withContent.length,
        candidatesQualified: newItems.length,
        enrichmentAttempts: persistence.enrichmentAttempts,
        prospectsInserted: persistence.prospectsInserted,
        contactReady: persistence.contactReady,
        emailNotFound: persistence.emailNotFound,
        enrichmentFailures: persistence.enrichmentFailures,
        persistenceFailures: persistence.persistenceFailures,
        callbackFailures: persistence.callbackFailures,
        duplicatesSkipped: persistence.duplicatesSkipped,
        budgetSkipped: persistence.budgetSkipped,
        transportFailures: serpFailures,
        exhausted: candidates.length < maxCandidates,
      }),
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    if (runId) await failProspectRun(runId, msg)
    return {
      prospectsCreated: 0,
      totalCostUsd,
      funnel: emptyStrategyFunnel({
        transportFailures: Math.max(1, serpFailures),
      }),
    }
  }
}
