import { supabaseAdmin } from "@workspace/supabase/admin"
import type { LimitFunction } from "p-limit"
import { LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import { createLogger } from "../../../helpers/logger.js"
import { competitorNamedInVisibleText } from "../shared/brand-mention.js"
import { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"
import {
  persistAndEnrich,
  type PersistenceFunnel,
} from "../shared/persist-and-enrich.js"
import type {
  EmailSettings,
  ProspectCreatedPayload,
} from "../shared/prospect-types.js"
import type { ResolvedSender } from "../shared/resolve-sender-name.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { extractDomainFromUrl } from "../shared/url-filters.js"
import { enrichProspect } from "./enrichment.js"
import { extractBacklinks } from "./extract-backlinks.js"
import type { ExtractBacklinksResult } from "./extract-backlinks.js"
import {
  filterBacklinks,
  type FilterSettings,
  type TaggedBacklinkItem,
} from "./filter-backlinks.js"
import { getLastMozCursor } from "./prospect-run-tracking.js"
import { scoreBacklinkRelevance } from "./score-backlink-relevance.js"
import {
  matchCompetitorTargetPage,
  type CompetitorTargetPage,
} from "./match-target-page.js"

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
    target_keywords?: string[] | null
  },
  settings: FilterSettings,
  sender: ResolvedSender,
  emailSettings: EmailSettings,
  enrichLimit: LimitFunction,
  maxProspects: number,
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  fetchLimit?: number,
  prefetched?: ExtractBacklinksResult,
  targetPages: CompetitorTargetPage[] = [],
  enrichmentBudget?: { remaining: number }
): Promise<{
  prospectsCreated: number
  costUsd: number
  nextCursor: string | null
  funnel: {
    extracted: number
    passedFilters: number
    scoredTotal: number
    kept: number
    toEnrich: number
    enrichedWithContact: number
  }
  persistence?: PersistenceFunnel
  transportFailures?: number
}> {
  const mozCursor = prefetched
    ? null
    : await getLastMozCursor(product.id, competitorDomain)

  log.info("processing competitor", {
    productId: product.id,
    competitorDomain,
    hasCursor: !!mozCursor,
  })

  try {
    const {
      items: rawItems,
      nextCursor,
      costUsd: fetchCost,
    } = prefetched ??
    (await extractBacklinks(competitorDomain, {
      ...settings,
      mozCursor,
      limit: fetchLimit,
    }))
    const tagged: TaggedBacklinkItem[] = rawItems.map((item) => ({
      ...item,
      competitorDomain,
    }))

    let filtered = filterBacklinks(tagged, settings, product.website_url)
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
      return {
        prospectsCreated: 0,
        costUsd: fetchCost,
        nextCursor,
        funnel: {
          extracted: rawItems.length,
          passedFilters: 0,
          scoredTotal: 0,
          kept: 0,
          toEnrich: 0,
          enrichedWithContact: 0,
        },
      }
    }

    // Real domain rating — only when the user has set a DR floor, checked as early as
    // possible so we don't pay for LLM relevance scoring or contact enrichment on sites
    // we're going to reject anyway. item.domainRating up to this point is DataForSEO's
    // own rank (used for the DataForSEO-side fetch filter and local dedup/cap), not
    // Ahrefs DR — don't persist it as domain_rating.
    let drByDomain = new Map<string, number | null>()
    if (settings.dr_min > 0) {
      const domains = [
        ...new Set(filtered.map((item) => extractDomainFromUrl(item.urlFrom))),
      ]
      drByDomain = await enrichDomainRatings(domains)
      filtered = filtered.filter((item) => {
        const dr = drByDomain.get(extractDomainFromUrl(item.urlFrom))
        if (dr == null) return false
        if (dr < settings.dr_min) return false
        if (settings.dr_max !== null && dr > settings.dr_max) return false
        return true
      })
      log.info("dr filter applied", {
        competitorDomain,
        dr_min: settings.dr_min,
        dr_max: settings.dr_max,
        kept: filtered.length,
      })
    }

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
      return {
        prospectsCreated: 0,
        costUsd: fetchCost,
        nextCursor,
        funnel: {
          extracted: rawItems.length,
          passedFilters: 0,
          scoredTotal: 0,
          kept: 0,
          toEnrich: 0,
          enrichedWithContact: 0,
        },
      }
    }

    const { results: scored, totalCost: pageScoringCost } =
      await scoreBacklinkRelevance(filtered, product)
    let totalCost = fetchCost + pageScoringCost
    const belowThreshold = scored.filter(
      (r) => r.relevanceScore < MIN_RELEVANCE_SCORE
    )
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
      return {
        prospectsCreated: 0,
        costUsd: totalCost,
        nextCursor,
        funnel: {
          extracted: rawItems.length,
          passedFilters: filtered.length,
          scoredTotal: scored.length,
          kept: 0,
          toEnrich: 0,
          enrichedWithContact: 0,
        },
      }
    }

    // Drop prospects we've already stored so we don't pay to enrich duplicates.
    const { data: existing } = await supabaseAdmin
      .from("backlink_prospects")
      .select("found_url, domain")
      .eq("product_id", product.id)
      .in("domain", [
        ...new Set(passing.map((item) => extractDomainFromUrl(item.urlFrom))),
      ])

    const existingUrls = new Set((existing ?? []).map((r) => r.found_url))
    const existingDomains = new Set((existing ?? []).map((r) => r.domain))
    const newDomains = new Set<string>()
    const newItems = passing.filter((item) => {
      const domain = extractDomainFromUrl(item.urlFrom)
      if (
        existingUrls.has(item.urlFrom) ||
        existingDomains.has(domain) ||
        newDomains.has(domain)
      )
        return false
      newDomains.add(domain)
      return true
    })

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
    const { results: siteRelevanceResults, cost: siteRelevanceCost } =
      await scoreSiteRelevance(siteRelevanceInputs, product)
    totalCost += siteRelevanceCost

    const persistence = await persistAndEnrich({
      productId: product.id,
      candidates: newItems.map((item) => ({
        item,
        foundUrl: item.urlFrom,
        domain: extractDomainFromUrl(item.urlFrom),
      })),
      budget,
      enrichmentBudget,
      enrichLimit,
      buildBareRow: ({ item, domain }) => {
        const sr = siteRelevanceResults.get(item.urlFrom)
        const targetPage = matchCompetitorTargetPage(item, targetPages)
        return {
          product_id: product.id,
          domain,
          domain_rating:
            settings.dr_min > 0 ? (drByDomain.get(domain) ?? null) : null,
          found_url: item.urlFrom,
          target_url: targetPage?.url ?? product.website_url,
          product_page_id: targetPage?.id ?? null,
          tier: "competitor_backlink" as const,
          status: "new" as const,
          site_relevance_score: sr?.score ?? null,
          enrichment_status: "pending" as const,
          raw_metadata: {
            outreach_context: {
              opportunityType: "competitor_backlink",
              title: item.title,
              anchor: item.anchor,
              pageType: item.pageType,
              competitorDomain: item.competitorDomain,
              competitorNamedInText: competitorNamedInVisibleText(
                item.competitorDomain,
                [item.anchor, item.title, item.textPre, item.textPost]
              ),
            },
          },
        }
      },
      enrich: ({ item, domain }) =>
        enrichProspect(item, product, domain, sender, emailSettings),
      onProspectCreated,
      logContext: { strategy: "competitor_backlink", competitorDomain },
    })
    const prospectsCreated = persistence.prospectsInserted
    const enrichedWithContact = persistence.contactReady

    log.info("rows upserted", {
      productId: product.id,
      competitorDomain,
      count: prospectsCreated,
    })

    return {
      prospectsCreated,
      costUsd: totalCost,
      nextCursor,
      funnel: {
        extracted: rawItems.length,
        passedFilters: filtered.length,
        scoredTotal: scored.length,
        kept: passing.length,
        toEnrich: persistence.enrichmentAttempts,
        enrichedWithContact,
      },
      persistence,
    }
  } catch (err) {
    // A total LLM outage isn't specific to this one competitor — every other
    // competitor in the run would fail the same way, so let it propagate to
    // the run-level catch (which marks the run "failed") instead of
    // reporting a clean zero per competitor.
    if (err instanceof LlmAllModelsFailedError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    log.error("competitor processing failed", {
      productId: product.id,
      competitorDomain,
      error: msg,
    })
    return {
      prospectsCreated: 0,
      costUsd: 0,
      nextCursor: null,
      funnel: {
        extracted: 0,
        passedFilters: 0,
        scoredTotal: 0,
        kept: 0,
        toEnrich: 0,
        enrichedWithContact: 0,
      },
      transportFailures: 1,
    }
  }
}
