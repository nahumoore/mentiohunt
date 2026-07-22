import { supabaseAdmin } from "@workspace/supabase/admin"
import type { LimitFunction } from "p-limit"
import { createLogger } from "../../../helpers/logger.js"
import { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"
import type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"
import type { ResolvedSender } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { extractDomainFromUrl } from "../shared/url-filters.js"
import { enrichProspect } from "./enrichment.js"
import { extractBacklinks } from "./extract-backlinks.js"
import { filterBacklinks, type FilterSettings, type TaggedBacklinkItem } from "./filter-backlinks.js"
import { getLastMozCursor } from "./prospect-run-tracking.js"
import { scoreBacklinkRelevance } from "./score-backlink-relevance.js"

const log = createLogger("process-competitor")

const MIN_RELEVANCE_SCORE = 3

export async function processCompetitor(
  competitorDomain: string,
  product: {
    id: string
    user_id: string
    product_name: string
    product_description: string
    website_url: string
  },
  settings: FilterSettings,
  sender: ResolvedSender,
  emailSettings: EmailSettings,
  enrichLimit: LimitFunction,
  maxProspects: number,
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  fetchLimit?: number
): Promise<{ prospectsCreated: number; costUsd: number; nextCursor: string | null }> {
  const mozCursor = await getLastMozCursor(product.id, competitorDomain)

  log.info("processing competitor", { productId: product.id, competitorDomain, hasCursor: !!mozCursor })

  try {
    const { items: rawItems, nextCursor, costUsd: fetchCost } = await extractBacklinks(competitorDomain, { ...settings, mozCursor, limit: fetchLimit })
    const tagged: TaggedBacklinkItem[] = rawItems.map((item) => ({ ...item, competitorDomain }))

    const filtered = filterBacklinks(tagged, settings)
    if (filtered.length === 0) {
      log.info("competitor digest", {
        competitorDomain,
        extracted: rawItems.length,
        passedFilters: 0,
        discardedByFilters: rawItems.length,
        scoredTotal: 0,
        discardedByScore: 0,
        kept: 0,
        inserted: 0,
      })
      return { prospectsCreated: 0, costUsd: fetchCost, nextCursor }
    }

    const { results: scored, totalCost: pageScoringCost } = await scoreBacklinkRelevance(filtered, product)
    let totalCost = fetchCost + pageScoringCost
    const belowThreshold = scored.filter((r) => r.relevanceScore < MIN_RELEVANCE_SCORE)
    const passing = scored
      .filter((r) => r.relevanceScore >= MIN_RELEVANCE_SCORE)
      .sort((a, b) => b.relevanceScore - a.relevanceScore)
      .slice(0, maxProspects)

    if (passing.length === 0) {
      log.info("competitor digest", {
        competitorDomain,
        extracted: rawItems.length,
        passedFilters: filtered.length,
        discardedByFilters: rawItems.length - filtered.length,
        scoredTotal: scored.length,
        discardedByScore: belowThreshold.length,
        discardedItems: belowThreshold.map((r) => ({
          url: r.urlFrom,
          score: r.relevanceScore,
          pageType: r.pageType,
          reason: r.relevanceReason,
        })),
        kept: 0,
        inserted: 0,
      })
      return { prospectsCreated: 0, costUsd: totalCost, nextCursor }
    }

    // Drop prospects we've already stored so we don't pay to enrich duplicates.
    const { data: existing } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url")
      .eq("product_id", product.id)
      .in("found_url", passing.map((item) => item.urlFrom))

    const existingUrls = new Set((existing ?? []).map((r) => r.found_url))
    const newItems = passing.filter((item) => !existingUrls.has(item.urlFrom))

    log.info("competitor digest", {
      competitorDomain,
      extracted: rawItems.length,
      passedFilters: filtered.length,
      discardedByFilters: rawItems.length - filtered.length,
      scoredTotal: scored.length,
      discardedByScore: belowThreshold.length,
      discardedItems: belowThreshold.map((r) => ({
        url: r.urlFrom,
        score: r.relevanceScore,
        pageType: r.pageType,
        reason: r.relevanceReason,
      })),
      kept: passing.length,
      keptItems: passing.map((r) => ({
        url: r.urlFrom,
        score: r.relevanceScore,
        pageType: r.pageType,
        reason: r.relevanceReason,
      })),
      toEnrich: newItems.length,
      duplicatesSkipped: passing.length - newItems.length,
    })

    // Score site-level relevance for new items using DeepSeek.
    const siteRelevanceInputs = newItems.map((item) => ({
      id: item.urlFrom,
      domain: extractDomainFromUrl(item.urlFrom),
      title: item.title || "",
      snippet: item.relevanceReason || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } = await scoreSiteRelevance(
      siteRelevanceInputs,
      product
    )
    totalCost += siteRelevanceCost

    // Claim budget synchronously, up front, so we only ever bare-insert
    // prospects we're actually going to enrich — otherwise a budget-skipped
    // row would sit in 'pending' forever and get deduped out of every future
    // run (found_url already exists).
    const toProcess = newItems.filter(() => {
      if (budget && budget.remaining <= 0) return false
      if (budget) budget.remaining -= 1
      return true
    })

    if (toProcess.length < newItems.length) {
      log.info("budget exhausted, skipping some prospects", {
        competitorDomain,
        skipped: newItems.length - toProcess.length,
      })
    }

    if (toProcess.length === 0) {
      return { prospectsCreated: 0, costUsd: totalCost, nextCursor }
    }

    // Real domain rating — only when the user has set a DR floor. item.domainRating
    // up to this point is DataForSEO's own rank (used for the DataForSEO-side fetch
    // filter and local dedup/cap), not Ahrefs DR — don't persist it as domain_rating.
    let drByDomain = new Map<string, number | null>()
    if (settings.dr_min > 0) {
      const domains = [...new Set(toProcess.map((item) => extractDomainFromUrl(item.urlFrom)))]
      drByDomain = await enrichDomainRatings(domains)
    }

    // Insert bare rows immediately so the UI shows discovered sites right
    // away; enrichment (contact + outreach email) fills each row in after.
    const bareRows = toProcess.map((item) => {
      const domain = extractDomainFromUrl(item.urlFrom)
      const sr = siteRelevanceResults.get(item.urlFrom)
      return {
        product_id: product.id,
        domain,
        domain_rating: settings.dr_min > 0 ? (drByDomain.get(domain) ?? null) : null,
        found_url: item.urlFrom,
        target_url: item.urlTo,
        tier: "competitor_backlink" as const,
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
      log.warn("bare prospect insert failed", { competitorDomain, error: insertError.message })
    }

    const idByUrl = new Map((insertedRows ?? []).map((r) => [r.found_url as string, r.id as string]))
    const prospectsCreated = idByUrl.size

    // Enrich each newly-inserted prospect, updating its row live as it completes.
    await Promise.allSettled(
      toProcess
        .filter((item) => idByUrl.has(item.urlFrom))
        .map((item) =>
          enrichLimit(async () => {
            const id = idByUrl.get(item.urlFrom)!
            const domain = extractDomainFromUrl(item.urlFrom)

            await supabaseAdmin
              .from("backlink_prospects")
              .update({ enrichment_status: "enriching" as const })
              .eq("id", id)

            const enriched = await enrichProspect(item, product, domain, sender, emailSettings)
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
              log.warn("prospect enrichment update failed", { competitorDomain, domain, error: error.message })
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
              log.info("no email found, marked email_not_found", { domain })
            }
          })
        )
    )

    log.info("rows upserted", { productId: product.id, competitorDomain, count: prospectsCreated })

    return { prospectsCreated, costUsd: totalCost, nextCursor }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("competitor processing failed", { productId: product.id, competitorDomain, error: msg })
    return { prospectsCreated: 0, costUsd: 0, nextCursor: null }
  }
}
