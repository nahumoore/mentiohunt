import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import {
  SCRAPERLINK_GOOGLE_SERP,
  type GoogleSerpItem,
} from "../../helpers/actors/google-serp-scraper.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { getDomainRating } from "../../helpers/ahrefs/get-domain-rating.js"
import { createLogger } from "../../helpers/logger.js"
import type { EmailSettings, ProspectCreatedPayload } from "../competitor-backlinks/discover-competitor-backlinks.js"
import { enrichContact } from "../competitor-backlinks/enrich-contact.js"
import { extractCompetitorDomain } from "../competitor-backlinks/extract-backlinks.js"
import {
  extractDomainFromUrl,
  isNoiseDomain,
  type FilterSettings,
} from "../competitor-backlinks/filter-backlinks.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { buildListicleQueries } from "./build-listicle-queries.js"
import { fetchPageContent } from "./check-listicle-client.js"
import { scoreListicleRelevance, type ListicleCandidate } from "./score-listicle-relevance.js"

const log = createLogger("discover-listicle-roundups")

const MIN_RELEVANCE_SCORE = 3
const MAX_CANDIDATES_TO_FETCH = 25
const MAX_PROSPECTS_PER_RUN = 15
const MAX_QUERIES_PER_RUN = 6
const SERP_RESULTS_PER_QUERY = "50"

type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  competitors?: string[] | null
}

type QualifiedListicle = ListicleCandidate & {
  domain: string
  relevanceScore: number
  relevanceReason: string
  topCompetitor: string | null
  domainRating: number | null
}

/**
 * Rotate through the query pool so a fixed subset doesn't re-run every day —
 * same least-recently-run selection as selectCompetitorsForRun in
 * discover-competitor-backlinks.ts, keyed by query string instead of domain.
 */
async function selectQueriesForRun(
  productId: string,
  allQueries: string[],
  maxQueries: number
): Promise<string[]> {
  const { data: recentRuns } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("input, completed_at")
    .eq("product_id", productId)
    .eq("strategy", "listicle_roundup")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const lastRunByQuery = new Map<string, string>()
  for (const run of (recentRuns ?? []) as Array<{
    input: { queries?: string[] } | null
    completed_at: string | null
  }>) {
    for (const query of run.input?.queries ?? []) {
      if (!lastRunByQuery.has(query)) {
        lastRunByQuery.set(query, run.completed_at ?? "")
      }
    }
  }

  return [...allQueries]
    .sort((a, b) => {
      const aTime = lastRunByQuery.get(a) ?? ""
      const bTime = lastRunByQuery.get(b) ?? ""
      return aTime < bTime ? -1 : 1
    })
    .slice(0, maxQueries)
}

async function createProspectRun(productId: string, queries: string[]): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({
      product_id: productId,
      strategy: "listicle_roundup",
      input: { queries },
      status: "running",
    })
    .select("id")
    .single()

  if (error) {
    log.warn("failed to create prospect run", { productId, error: error.message })
    return null
  }
  return (data as { id: string }).id
}

async function completeProspectRun(runId: string, prospectsCreated: number, costUsd: number): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
    })
    .eq("id", runId)
}

async function failProspectRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}

/** Look up domain ratings for the given domains via Ahrefs. Best-effort. */
async function enrichDomainRatings(domains: string[]): Promise<Map<string, number | null>> {
  const map = new Map<string, number | null>()
  if (domains.length === 0) return map

  try {
    const limit = pLimit(5)
    await Promise.all(
      domains.map((domain) =>
        limit(async () => {
          const rating = await getDomainRating(domain)
          map.set(domain, rating)
        })
      )
    )
  } catch (err) {
    log.warn("DR enrichment failed", { error: String(err) })
  }
  return map
}

type EnrichedColumns = {
  contact_name: string | null
  contact_email: string | null
  contact_social_links: Record<string, string> | null
  email_subject: string | null
  email_body: string | null
  step2_body: string | null
  step3_body: string | null
  raw_metadata: unknown
}

const EMPTY_ENRICHMENT: EnrichedColumns = {
  contact_name: null,
  contact_email: null,
  contact_social_links: null,
  email_subject: null,
  email_body: null,
  step2_body: null,
  step3_body: null,
  raw_metadata: null,
}

/**
 * Resolve contact + email draft for a listicle prospect. Returns the columns
 * to persist so the row can be inserted fully enriched (no contactless
 * intermediate state).
 */
async function enrichListicle(
  item: QualifiedListicle,
  product: Product,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  try {
    const contact = await enrichContact(item.url, "roundup", item.domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

    if (!contact.email) {
      log.info("contact name without email", { domain: item.domain, contactName: contact.name })
      return {
        contact_name: contact.name,
        contact_email: null,
        contact_social_links: social,
        email_subject: null,
        email_body: null,
        step2_body: null,
        step3_body: null,
        raw_metadata: contact.rawMetadata,
      }
    }

    const competitorDomain =
      item.topCompetitor ||
      (product.competitors?.[0] ? extractCompetitorDomain(product.competitors[0]) : "similar tools")

    const emailResult = await generateOutreachSequence(
      product,
      {
        opportunityType: "listicle_roundup",
        title: item.title,
        anchor: "",
        pageType: "roundup",
        competitorDomain,
      },
      {
        contactName: contact.name,
        senderName: sender.name,
        isPublicAccount: sender.isPublicAccount,
        voiceTone: emailSettings.voice_tone,
        offering: emailSettings.offering,
        authorBio: contact.rawMetadata?.bio ?? null,
      }
    )

    log.success("enrichment complete", {
      domain: item.domain,
      contactConfidence: contact.confidence,
      hasEmailDraft: !!emailResult,
    })

    return {
      contact_name: contact.name,
      contact_email: contact.email,
      contact_social_links: social,
      email_subject: emailResult?.subject ?? null,
      email_body: emailResult?.step1Body ?? null,
      step2_body: emailResult?.step2Body ?? null,
      step3_body: emailResult?.step3Body ?? null,
      raw_metadata: contact.rawMetadata,
    }
  } catch (err) {
    log.warn("listicle enrichment failed", { domain: item.domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT }
  }
}

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
    const fetchLimit = pLimit(5)
    const fetched = await Promise.all(
      candidates.map((c) =>
        fetchLimit(async () => {
          const content = await fetchPageContent(c.url)
          return { candidate: c, content }
        })
      )
    )

    const withContent = fetched.filter(
      (f): f is { candidate: (typeof candidates)[number]; content: NonNullable<(typeof f)["content"]> } =>
        f.content !== null
    )
    log.info("content fetched", { productId: product.id, attempted: fetched.length, fetched: withContent.length })

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

    // 7. Enrich each prospect first, then insert the fully-populated row so the
    //    UI never shows a contactless prospect that fills in later.
    const enrichLimit = pLimit(3)
    let prospectsCreated = 0
    await Promise.allSettled(
      newItems.map((item) =>
        enrichLimit(async () => {
          // Budget guard — claim synchronously before any expensive I/O.
          if (budget && budget.remaining <= 0) return
          if (budget) budget.remaining -= 1

          const enriched = await enrichListicle(item, product, sender, emailSettings)

          if (!enriched.contact_email) {
            log.info("skipping prospect, no email found", { domain: item.domain })
            return
          }

          const sr = siteRelevanceResults.get(item.url)
          const { step2_body, step3_body, ...dbEnriched } = enriched

          const { data, error } = await supabaseAdmin
            .from("backlink_prospects")
            .upsert(
              {
                product_id: product.id,
                domain: item.domain,
                domain_rating: item.domainRating,
                found_url: item.url,
                target_url: product.website_url,
                tier: "listicle_roundup" as const,
                status: "new" as const,
                site_relevance_score: sr?.score ?? null,
                ...dbEnriched,
              },
              { onConflict: "product_id,found_url", ignoreDuplicates: true }
            )
            .select("id")

          if (error) {
            log.warn("prospect upsert failed", { domain: item.domain, error: error.message })
            return
          }
          if ((data ?? []).length > 0) {
            prospectsCreated += 1
            onProspectCreated?.({
              id: (data as Array<{ id: string }>)[0]!.id,
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
