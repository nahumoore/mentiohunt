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
import type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { extractDomainFromUrl, isNoiseDomain } from "../shared/url-filters.js"
import { buildListicleQueries } from "./build-listicle-queries.js"
import { fetchPageContent } from "./check-listicle-client.js"
import { enrichListicle, type Product, type QualifiedListicle } from "./enrichment.js"
import { completeProspectRun, createProspectRun, failProspectRun, selectQueriesForRun } from "./prospect-run-tracking.js"
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
  onProspectCreated?: (p: ProspectCreatedPayload) => void
): Promise<{ prospectsCreated: number; totalCostUsd: number }> {
  const maxCandidates = limits.maxCandidates ?? MAX_CANDIDATES_TO_FETCH
  const maxProspects = limits.maxProspects ?? MAX_PROSPECTS_PER_RUN
  const ownDomain = extractDomainFromUrl(product.website_url)
  const productName = product.product_name?.trim() ?? ""

  log.info("discovery started", { productId: product.id, ownDomain, productName })

  if (!ownDomain || !productName) {
    log.info("missing domain or product name, skipping", { productId: product.id })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)

  let totalCostUsd = 0

  const { queries: queryPool, cost: queryBuildCost } = await buildListicleQueries(product)
  totalCostUsd += queryBuildCost

  if (queryPool.length === 0) {
    log.info("no queries built, skipping", { productId: product.id })
    return { prospectsCreated: 0, totalCostUsd }
  }

  const queries = await selectQueriesForRun(product.id, queryPool, MAX_QUERIES_PER_RUN)

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
              { keyword, limit: SERP_RESULTS_PER_QUERY, country: "US", include_merged: false },
              90
            )
          } catch (err) {
            log.warn("SERP query failed", { productId: product.id, keyword, error: String(err) })
            return []
          }
        })
      )
    )
    const serpResults = serpBatches.flatMap((batch) => batch.flatMap((item) => item.results ?? []))

    // 2. Dedup by URL, drop own domain + noise/aggregator domains.
    const byUrl = new Map<string, { url: string; domain: string; title: string; snippet: string }>()
    for (const r of serpResults) {
      if (!r.url) continue
      const domain = extractDomainFromUrl(r.url)
      if (!domain || domain === ownDomain || isNoiseDomain(domain)) continue
      const normalizedUrl = r.url.replace(/\/$/, "")
      if (byUrl.has(normalizedUrl)) continue
      byUrl.set(normalizedUrl, {
        url: r.url,
        domain,
        title: r.title ?? "",
        snippet: r.description ?? "",
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
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 2b. Drop candidates we've already stored — before spending on fetch/score,
    // not after. Query rotation means most URLs seen again are ones we already have.
    const { data: existingProspects } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url")
      .eq("product_id", product.id)
      .in("found_url", [...byUrl.values()].map((c) => c.url))

    const existingUrls = new Set((existingProspects ?? []).map((r) => r.found_url))
    const freshCandidates = [...byUrl.values()].filter((c) => !existingUrls.has(c.url))
    const candidates = freshCandidates.slice(0, maxCandidates)

    log.info("candidates gathered", {
      productId: product.id,
      queries: queries.length,
      serpResults: serpResults.length,
      uniqueUrls: byUrl.size,
      alreadyStored: byUrl.size - freshCandidates.length,
      toFetch: candidates.length,
    })

    if (candidates.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
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
      (f): f is { candidate: (typeof candidates)[number]; content: NonNullable<(typeof f)["content"]> } =>
        f.content !== null
    )
    log.info("content fetched", {
      productId: product.id,
      attempted: fetched.length,
      fetched: withContent.length,
      outcomes: outcomeCounts,
    })

    if (withContent.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 4. Relevance scoring — genuine listicle in-category, product not yet listed.
    const { results: scored, totalCost: scoringCost } = await scoreListicleRelevance(
      withContent.map((f) => ({
        url: f.candidate.url,
        title: f.content.title || f.candidate.title,
        text: f.content.text,
      })),
      product
    )
    totalCostUsd += scoringCost

    const contentByUrl = new Map(withContent.map((f) => [f.candidate.url, f.candidate]))
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

    if (qualified.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 5. Domain rating — only when the user has set a DR floor.
    if (settings.dr_min > 0) {
      const drByDomain = await enrichDomainRatings([...new Set(qualified.map((q) => q.domain))])
      qualified = qualified
        .map((q) => ({ ...q, domainRating: drByDomain.get(q.domain) ?? null }))
        .filter((q) => {
          const dr = q.domainRating
          if (dr === null) return false
          if (dr < settings.dr_min) return false
          if (settings.dr_max !== null && dr > settings.dr_max) return false
          return true
        })
      log.info("dr filter applied", { productId: product.id, dr_min: settings.dr_min, kept: qualified.length })
    }

    if (qualified.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // Already-known URLs were filtered out at step 2b, before fetch/score, so
    // everything that survives scoring + DR filtering is new.
    const newItems = qualified

    if (newItems.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 6. Score site-level relevance for new items.
    const siteRelevanceInputs = newItems.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.relevanceReason || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } = await scoreSiteRelevance(
      siteRelevanceInputs,
      product
    )
    totalCostUsd += siteRelevanceCost

    // Claim budget synchronously, up front, so we only ever bare-insert
    // prospects we're actually going to enrich — otherwise a budget-skipped
    // row would sit in 'pending' forever and get deduped out of every future
    // run (found_url already exists).
    const toProcess = newItems.filter(() => {
      if (budget && budget.remaining <= 0) return false
      if (budget) budget.remaining -= 1
      return true
    })

    if (toProcess.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // Insert bare rows immediately so the UI shows discovered sites right
    // away; enrichment (contact + outreach email) fills each row in after.
    const bareRows = toProcess.map((item) => {
      const sr = siteRelevanceResults.get(item.url)
      return {
        product_id: product.id,
        domain: item.domain,
        domain_rating: item.domainRating,
        found_url: item.url,
        target_url: product.website_url,
        tier: "listicle_roundup" as const,
        status: "new" as const,
        site_relevance_score: sr?.score ?? null,
        enrichment_status: "pending" as const,
      }
    })

    const { data: insertedRows, error: insertError } = await supabaseAdmin
      .from("backlink_prospects")
      .upsert(bareRows, { onConflict: "product_id,found_url", ignoreDuplicates: true })
      .select("id, found_url")

    if (insertError) {
      log.warn("bare prospect insert failed", { productId: product.id, error: insertError.message })
    }

    const idByUrl = new Map((insertedRows ?? []).map((r) => [r.found_url as string, r.id as string]))
    const prospectsCreated = idByUrl.size

    // Enrich each newly-inserted prospect, updating its row live as it completes.
    const enrichLimit = pLimit(5)
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

            const enriched = await enrichListicle(item, product, sender, emailSettings)
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
            } else {
              log.info("no email found, marked email_not_found", { domain: item.domain })
            }
          })
        )
    )

    log.info("rows upserted", { productId: product.id, inserted: prospectsCreated })

    if (runId) await completeProspectRun(runId, prospectsCreated, totalCostUsd)
    return { prospectsCreated, totalCostUsd }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    if (runId) await failProspectRun(runId, msg)
    return { prospectsCreated: 0, totalCostUsd }
  }
}
