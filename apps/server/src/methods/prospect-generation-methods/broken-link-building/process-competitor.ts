import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import type { LimitFunction } from "p-limit"
import { LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import { createLogger } from "../../../helpers/logger.js"
import { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"
import type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"
import type { ResolvedSender } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { extractDomainFromUrl } from "../shared/url-filters.js"
import { enrichBrokenLinkProspect } from "./enrichment.js"
import { extractDeadTargets } from "./extract-dead-targets.js"
import { filterDeadLinkCandidates, type FilterSettings } from "./filter-dead-link-candidates.js"
import { matchReplacementPages } from "./match-replacement-page.js"
import { getLastCursor } from "./prospect-run-tracking.js"
import type { DeadLinkCandidate, MatchedDeadLinkCandidate, ReplacementPageCandidate } from "./types.js"
import { verifyLiveLink } from "./verify-live-link.js"

const log = createLogger("process-competitor-broken-link")

const LIVE_CHECK_CONCURRENCY = 5

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
  replacementPages: ReplacementPageCandidate[],
  sender: ResolvedSender,
  emailSettings: EmailSettings,
  enrichLimit: LimitFunction,
  maxProspects: number,
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  fetchLimit?: number
): Promise<{
  prospectsCreated: number
  costUsd: number
  nextCursor: string | null
  funnel: {
    extracted: number
    afterFilter: number
    afterDedup: number
    confirmedLive: number
    matched: number
    toEnrich: number
    enrichedWithContact: number
  }
}> {
  const cursor = await getLastCursor(product.id, competitorDomain)
  const emptyFunnel = { extracted: 0, afterFilter: 0, afterDedup: 0, confirmedLive: 0, matched: 0, toEnrich: 0, enrichedWithContact: 0 }

  log.info("processing competitor", { productId: product.id, competitorDomain, hasCursor: !!cursor })

  try {
    const { candidates: rawCandidates, nextCursor, costUsd: fetchCost } = await extractDeadTargets(competitorDomain, {
      ...settings,
      mozCursor: cursor,
      limit: fetchLimit,
    })
    let totalCost = fetchCost

    if (rawCandidates.length === 0) {
      return { prospectsCreated: 0, costUsd: totalCost, nextCursor, funnel: { ...emptyFunnel, extracted: 0 } }
    }

    const filtered = filterDeadLinkCandidates(rawCandidates, settings, product.website_url)
    if (filtered.length === 0) {
      return { prospectsCreated: 0, costUsd: totalCost, nextCursor, funnel: { ...emptyFunnel, extracted: rawCandidates.length } }
    }

    // Drop prospects we've already stored so we don't pay to verify/match duplicates.
    const { data: existing } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url")
      .eq("product_id", product.id)
      .in("found_url", filtered.map((item) => item.urlFrom))

    const existingUrls = new Set((existing ?? []).map((r) => r.found_url))
    const newItems = filtered.filter((item) => !existingUrls.has(item.urlFrom))

    if (newItems.length === 0) {
      return {
        prospectsCreated: 0,
        costUsd: totalCost,
        nextCursor,
        funnel: { ...emptyFunnel, extracted: rawCandidates.length, afterFilter: filtered.length },
      }
    }

    // DataForSEO's index lags — confirm the dead link is still literally
    // present on the live page before pitching a replacement. Being wrong
    // here is publicly embarrassing (see ticket 04), so this check is not
    // optional.
    const liveLimit = pLimit(LIVE_CHECK_CONCURRENCY)
    const liveChecks = await Promise.all(
      newItems.map((item) => liveLimit(async () => ({ item, stillPresent: await verifyLiveLink(item.urlFrom, item.deadUrl) })))
    )
    const confirmed: DeadLinkCandidate[] = liveChecks.filter((c) => c.stillPresent).map((c) => c.item)

    if (confirmed.length === 0) {
      log.info("competitor digest", {
        competitorDomain,
        extracted: rawCandidates.length,
        afterFilter: filtered.length,
        afterDedup: newItems.length,
        confirmedLive: 0,
      })
      return {
        prospectsCreated: 0,
        costUsd: totalCost,
        nextCursor,
        funnel: { ...emptyFunnel, extracted: rawCandidates.length, afterFilter: filtered.length, afterDedup: newItems.length },
      }
    }

    // No replacement page found -> drop in v1 rather than send a bare
    // heads-up (open question in ticket 04, revisit once reply data exists).
    const { results: matches, totalCost: matchCost } = await matchReplacementPages(confirmed, replacementPages, product)
    totalCost += matchCost

    const pageById = new Map(replacementPages.map((p) => [p.id, p]))
    const withMatch: MatchedDeadLinkCandidate[] = confirmed
      .map((item) => {
        const match = matches.get(item.urlFrom)
        if (!match?.targetPageId) return null
        const page = pageById.get(match.targetPageId)
        if (!page) return null
        return {
          ...item,
          targetPageId: page.id,
          targetUrl: page.url,
          targetTitle: page.title || "this page",
          matchReason: match.reason,
        }
      })
      .filter((m): m is MatchedDeadLinkCandidate => m !== null)
    const matched = withMatch.slice(0, maxProspects)

    log.info("competitor digest", {
      competitorDomain,
      extracted: rawCandidates.length,
      afterFilter: filtered.length,
      afterDedup: newItems.length,
      confirmedLive: confirmed.length,
      droppedNoMatch: confirmed.length - withMatch.length,
      matched: matched.length,
    })

    if (matched.length === 0) {
      return {
        prospectsCreated: 0,
        costUsd: totalCost,
        nextCursor,
        funnel: {
          ...emptyFunnel,
          extracted: rawCandidates.length,
          afterFilter: filtered.length,
          afterDedup: newItems.length,
          confirmedLive: confirmed.length,
        },
      }
    }

    const siteRelevanceInputs = matched.map((item) => ({
      id: item.urlFrom,
      domain: extractDomainFromUrl(item.urlFrom),
      title: item.title || "",
      snippet: item.matchReason || "",
    }))
    const { results: siteRelevanceResults, cost: siteRelevanceCost } = await scoreSiteRelevance(siteRelevanceInputs, product)
    totalCost += siteRelevanceCost

    // Claim budget synchronously, up front — a budget-skipped row would sit
    // in 'pending' forever and get deduped out of every future run since
    // found_url already exists.
    const toProcess = matched.filter(() => {
      if (budget && budget.remaining <= 0) return false
      if (budget) budget.remaining -= 1
      return true
    })

    if (toProcess.length === 0) {
      return {
        prospectsCreated: 0,
        costUsd: totalCost,
        nextCursor,
        funnel: {
          ...emptyFunnel,
          extracted: rawCandidates.length,
          afterFilter: filtered.length,
          afterDedup: newItems.length,
          confirmedLive: confirmed.length,
          matched: matched.length,
        },
      }
    }

    let drByDomain = new Map<string, number | null>()
    if (settings.dr_min > 0) {
      const domains = [...new Set(toProcess.map((item) => extractDomainFromUrl(item.urlFrom)))]
      drByDomain = await enrichDomainRatings(domains)
    }

    const bareRows = toProcess.map((item) => {
      const domain = extractDomainFromUrl(item.urlFrom)
      const sr = siteRelevanceResults.get(item.urlFrom)
      return {
        product_id: product.id,
        product_page_id: item.targetPageId,
        domain,
        domain_rating: settings.dr_min > 0 ? (drByDomain.get(domain) ?? null) : null,
        found_url: item.urlFrom,
        target_url: item.targetUrl,
        tier: "broken_link_building" as const,
        status: "new" as const,
        site_relevance_score: sr?.score ?? null,
        enrichment_status: "pending" as const,
        raw_metadata: {
          broken_link_building: {
            deadUrl: item.deadUrl,
            deadUrlStatus: item.deadUrlStatus,
            anchorText: item.anchor || null,
            competitorDomain: item.competitorDomain,
            targetPageId: item.targetPageId,
            matchReason: item.matchReason,
          },
        },
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

    let enrichedWithContact = 0
    await Promise.allSettled(
      toProcess
        .filter((item) => idByUrl.has(item.urlFrom))
        .map((item) =>
          enrichLimit(async () => {
            const id = idByUrl.get(item.urlFrom)!
            const domain = extractDomainFromUrl(item.urlFrom)

            await supabaseAdmin.from("backlink_prospects").update({ enrichment_status: "enriching" as const }).eq("id", id)

            const enriched = await enrichBrokenLinkProspect(item, product, domain, sender, emailSettings)
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
              enrichedWithContact += 1
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

    return {
      prospectsCreated,
      costUsd: totalCost,
      nextCursor,
      funnel: {
        extracted: rawCandidates.length,
        afterFilter: filtered.length,
        afterDedup: newItems.length,
        confirmedLive: confirmed.length,
        matched: matched.length,
        toEnrich: toProcess.length,
        enrichedWithContact,
      },
    }
  } catch (err) {
    // A total LLM outage isn't specific to this one competitor — every other
    // competitor in the run would fail the same way, so let it propagate to
    // the run-level catch (which marks the run "failed") instead of
    // reporting a clean zero per competitor.
    if (err instanceof LlmAllModelsFailedError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    log.error("competitor processing failed", { productId: product.id, competitorDomain, error: msg })
    return {
      prospectsCreated: 0,
      costUsd: 0,
      nextCursor: null,
      funnel: { extracted: 0, afterFilter: 0, afterDedup: 0, confirmedLive: 0, matched: 0, toEnrich: 0, enrichedWithContact: 0 },
    }
  }
}
