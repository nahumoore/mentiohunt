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
import { checkMention } from "./check-mention-client.js"
import { enrichMention, type Product, type QualifiedMention } from "./enrichment.js"
import { completeProspectRun, createProspectRun, failProspectRun } from "./prospect-run-tracking.js"
import { scoreMentionRelevance, type MentionCandidate } from "./score-mention-relevance.js"

const log = createLogger("discover-unlinked-mentions")

const MIN_RELEVANCE_SCORE = 3
const MAX_CANDIDATES_TO_SCRAPE = 25
const MAX_PROSPECTS_PER_RUN = 20

export async function discoverUnlinkedMentions(
  product: Product,
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  limits: { maxCandidates?: number; maxProspects?: number } = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void
): Promise<{ prospectsCreated: number; totalCostUsd: number }> {
  const maxCandidates = limits.maxCandidates ?? MAX_CANDIDATES_TO_SCRAPE
  const maxProspects = limits.maxProspects ?? MAX_PROSPECTS_PER_RUN
  const ownDomain = extractDomainFromUrl(product.website_url)
  const productName = product.product_name?.trim() ?? ""

  log.info("discovery started", { productId: product.id, ownDomain, productName })

  if (!ownDomain || !productName) {
    log.info("missing domain or product name, skipping", { productId: product.id })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const brandTerms = [productName]

  const sender = await resolveSenderName(product.user_id)

  const runId = await createProspectRun(product.id, brandTerms)
  let totalCostUsd = 0

  try {
    // 1. SERP discovery — pages mentioning the brand, excluding our own site.
    const keyword = `"${productName}" -site:${ownDomain}`
    const serp = await runApifyActor<GoogleSerpItem[]>(
      SCRAPERLINK_GOOGLE_SERP,
      { keyword, limit: "50", country: "US", include_merged: false },
      90
    )
    const serpResults = serp.flatMap((item) => item.results ?? [])

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
    const candidates = [...byDomain.values()].slice(0, maxCandidates)

    log.info("candidates gathered", {
      productId: product.id,
      serpResults: serpResults.length,
      uniqueDomains: byDomain.size,
      toScrape: candidates.length,
    })

    if (candidates.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
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

    let qualified: QualifiedMention[] = checked
      .filter((c) => c.result?.qualified)
      .map((c) => ({ ...c.candidate, contact: c.result!.contact, domainRating: null }))

    log.info("mention check complete", {
      productId: product.id,
      checked: checked.length,
      qualified: qualified.length,
    })

    // 4. Domain rating — only when the user has set a DR floor.
    if (settings.dr_min > 0 && qualified.length > 0) {
      const drByDomain = await enrichDomainRatings([...new Set(qualified.map((q) => q.domain))])
      log.info("domain ratings fetched", {
        productId: product.id,
        ratings: [...drByDomain.entries()].map(([domain, dr]) => ({ domain, dr })),
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
      log.info("dr filter applied", { productId: product.id, dr_min: settings.dr_min, kept: qualified.length })
    }

    if (qualified.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 5. Relevance scoring.
    const { results: scored, totalCost: scoringCost } = await scoreMentionRelevance(
      qualified.map((q) => ({ url: q.url, title: q.title, snippet: q.snippet })),
      product
    )
    totalCostUsd += scoringCost

    const scoreByUrl = new Map(scored.map((s) => [s.url, s]))
    const passing = qualified
      .filter((q) => (scoreByUrl.get(q.url)?.relevanceScore ?? 0) >= MIN_RELEVANCE_SCORE)
      .sort(
        (a, b) =>
          (scoreByUrl.get(b.url)?.relevanceScore ?? 0) - (scoreByUrl.get(a.url)?.relevanceScore ?? 0)
      )
      .slice(0, maxProspects)

    log.info("scoring filter", {
      productId: product.id,
      scored: scored.length,
      passing: passing.length,
    })

    if (passing.length === 0) {
      if (runId) await completeProspectRun(runId, 0, totalCostUsd)
      return { prospectsCreated: 0, totalCostUsd }
    }

    // 6. Drop prospects we've already stored so we don't re-enrich duplicates.
    const { data: existing } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url")
      .eq("product_id", product.id)
      .in("found_url", passing.map((item) => item.url))

    const existingUrls = new Set((existing ?? []).map((r) => r.found_url))
    const newItems = passing.filter((item) => !existingUrls.has(item.url))

    log.info("dedup", {
      productId: product.id,
      toEnrich: newItems.length,
      duplicatesSkipped: passing.length - newItems.length,
    })

    // 7. Score site-level relevance for new items using DeepSeek.
    const siteRelevanceInputs = newItems.map((item) => ({
      id: item.url,
      domain: item.domain,
      title: item.title || "",
      snippet: item.snippet || "",
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
        tier: "unlinked_mention" as const,
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

            const enriched = await enrichMention(item, product, sender, emailSettings)
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
