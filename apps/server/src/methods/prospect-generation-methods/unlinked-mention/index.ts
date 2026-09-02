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
import { checkMention } from "./check-mention-client.js"
import {
  enrichMention,
  type Product,
  type QualifiedMention,
} from "./enrichment.js"
import {
  completeProspectRun,
  createProspectRun,
  failProspectRun,
  getLastCompletedRunDate,
  selectQueriesForRun,
} from "./prospect-run-tracking.js"
import {
  scoreMentionRelevance,
  type MentionCandidate,
} from "./score-mention-relevance.js"

const log = createLogger("discover-unlinked-mentions")

const MIN_RELEVANCE_SCORE = 3
const MAX_CANDIDATES_TO_SCRAPE = 25
const MAX_PROSPECTS_PER_RUN = 20
const MAX_QUERIES_PER_RUN = 2

export async function discoverUnlinkedMentions(
  product: Product,
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  limits: { maxCandidates?: number; maxProspects?: number } = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  enrichmentBudget?: { remaining: number }
): Promise<StrategyResult> {
  const maxCandidates = limits.maxCandidates ?? MAX_CANDIDATES_TO_SCRAPE
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
    const runId = await createProspectRun(product.id, [], [])
    if (runId)
      await completeProspectRun(runId, 0, 0, {
        skip_reason: "missing_domain_or_name",
      })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const brandTerms = [productName]
  const funnel: Record<string, unknown> = {}

  const sender = await resolveSenderName(product.user_id)

  // Rotate through query variants so repeat runs don't re-scrape the same
  // stable top results every day, and add a freshness query for mentions
  // published since the last completed run.
  const queryPool = [
    `"${productName}" -site:${ownDomain}`,
    `"${productName}" review -site:${ownDomain}`,
    `"${productName}" alternatives -site:${ownDomain}`,
    `"${productName}" vs -site:${ownDomain}`,
    `"${productName}" pricing -site:${ownDomain}`,
    `"${productName}" tutorial -site:${ownDomain}`,
  ]
  const queries = await selectQueriesForRun(
    product.id,
    queryPool,
    MAX_QUERIES_PER_RUN
  )

  const lastRunDate = await getLastCompletedRunDate(product.id)
  if (lastRunDate) {
    queries.push(`"${productName}" -site:${ownDomain} after:${lastRunDate}`)
  }

  log.info("queries selected for run", {
    productId: product.id,
    poolSize: queryPool.length,
    selected: queries.length,
    freshnessSince: lastRunDate,
  })

  const runId = await createProspectRun(product.id, brandTerms, queries)
  let totalCostUsd = 0
  let serpFailures = 0

  try {
    // 1. SERP discovery — pages mentioning the brand, excluding our own site.
    const serpLimit = pLimit(3)
    const serpBatches = await Promise.all(
      queries.map((keyword) =>
        serpLimit(async () => {
          try {
            return await runApifyActor<GoogleSerpItem[]>(
              SCRAPERLINK_GOOGLE_SERP,
              { keyword, limit: "50", country: "US", include_merged: false },
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

    // 2. Dedup by domain, drop own domain + big aggregators/socials.
    const byDomain = new Map<string, MentionCandidate & { domain: string }>()
    for (const r of serpResults) {
      if (!r.url) continue
      const domain = extractDomainFromUrl(r.url)
      if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue
      if (byDomain.has(domain)) continue
      byDomain.set(domain, {
        url: r.url,
        domain,
        title: r.title ?? "",
        snippet: r.description ?? "",
      })
    }
    // 2b. Drop domains we've already stored a prospect for — before the
    // expensive checkMention scrape, not after scoring. Query rotation means
    // most re-surfaced results are ones we already have.
    const gathered = [...byDomain.values()]
    let freshCandidates = gathered
    if (gathered.length > 0) {
      const { data: existingProspects } = await supabaseAdmin
        .from("backlink_prospects")
        .select("found_url, domain")
        .eq("product_id", product.id)
        .in(
          "domain",
          gathered.map((c) => c.domain)
        )

      const existingUrls = new Set(
        (existingProspects ?? []).map((r) => r.found_url)
      )
      const existingDomains = new Set(
        (existingProspects ?? []).map((r) => r.domain)
      )
      freshCandidates = gathered.filter(
        (c) => !existingUrls.has(c.url) && !existingDomains.has(c.domain)
      )
    }
    await storeDiscoveryCandidates(
      product.id,
      "unlinked_mention",
      freshCandidates.map((candidate, index) => ({
        candidateKey: candidate.domain,
        ...candidate,
        priorityScore: freshCandidates.length - index,
      }))
    )
    const claimed = await claimDiscoveryCandidates(
      product.id,
      "unlinked_mention",
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
      uniqueDomains: byDomain.size,
      alreadyStored: gathered.length - freshCandidates.length,
      toScrape: candidates.length,
    })
    funnel.candidates_gathered = byDomain.size
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

    // 3. Verify mention + no existing link, enriching contact in the same call.
    const checkLimit = pLimit(8)
    const checked = await Promise.all(
      candidates.map((c) =>
        checkLimit(async () => {
          const result = await checkMention(c.url, brandTerms, ownDomain)
          return { candidate: c, result }
        })
      )
    )
    await retryDiscoveryCandidates(
      checked
        .filter((item) => item.result === null && item.candidate.backlogId)
        .map((item) => item.candidate.backlogId as string),
      "mention_check_transport_failed"
    )
    await completeDiscoveryCandidates(
      checked
        .filter((item) => item.result !== null && item.candidate.backlogId)
        .map((item) => item.candidate.backlogId as string)
    )

    let qualified: QualifiedMention[] = checked
      .filter((c) => c.result?.qualified)
      .map((c) => ({
        ...c.candidate,
        contact: c.result!.contact,
        domainRating: null,
      }))

    log.info("mention check complete", {
      productId: product.id,
      checked: checked.length,
      qualified: qualified.length,
    })
    funnel.after_mention_check = qualified.length
    funnel.transport_failures = checked.filter((c) => c.result === null).length

    // 4. Domain rating — only when the user has set a DR floor.
    if (settings.dr_min > 0 && qualified.length > 0) {
      const drByDomain = await enrichDomainRatings([
        ...new Set(qualified.map((q) => q.domain)),
      ])
      log.info("domain ratings fetched", {
        productId: product.id,
        ratings: [...drByDomain.entries()].map(([domain, dr]) => ({
          domain,
          dr,
        })),
      })
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

    // 5. Relevance scoring.
    const { results: scored, totalCost: scoringCost } =
      await scoreMentionRelevance(
        qualified.map((q) => ({
          url: q.url,
          title: q.title,
          snippet: q.snippet,
        })),
        product
      )
    totalCostUsd += scoringCost

    const scoreByUrl = new Map(scored.map((s) => [s.url, s]))
    const passing = qualified
      .filter(
        (q) =>
          (scoreByUrl.get(q.url)?.relevanceScore ?? 0) >= MIN_RELEVANCE_SCORE
      )
      .sort(
        (a, b) =>
          (scoreByUrl.get(b.url)?.relevanceScore ?? 0) -
          (scoreByUrl.get(a.url)?.relevanceScore ?? 0)
      )
      .slice(0, maxProspects)

    log.info("scoring filter", {
      productId: product.id,
      scored: scored.length,
      passing: passing.length,
    })
    funnel.after_scoring = passing.length

    if (passing.length === 0) {
      if (runId)
        await completeProspectRun(runId, 0, totalCostUsd, {
          ...funnel,
          qualified: 0,
        })
      return { prospectsCreated: 0, totalCostUsd }
    }

    // Already-stored URLs/domains were filtered out at step 2b, before the
    // scrape, so everything that survives scoring is new.
    const newItems = passing

    // 6. Score site-level relevance for new items using DeepSeek.
    const siteRelevanceInputs = newItems.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.snippet || "",
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
          tier: "unlinked_mention" as const,
          status: "new" as const,
          site_relevance_score: sr?.score ?? null,
          enrichment_status: "pending" as const,
          raw_metadata: {
            outreach_context: {
              opportunityType: "unlinked_mention",
              title: item.title,
              foundUrl: item.url,
            },
          },
        }
      },
      enrich: ({ item }) => enrichMention(item, product, sender, emailSettings),
      onProspectCreated,
      logContext: { strategy: "unlinked_mention" },
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
        candidatesFetched: checked.length,
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
      funnel: emptyStrategyFunnel({ transportFailures: 1 }),
    }
  }
}
