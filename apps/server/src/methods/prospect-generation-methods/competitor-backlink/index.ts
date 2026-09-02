import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { getBacklinkPageIntersection } from "../../../helpers/data-for-seo/get-backlink-page-intersection.js"
import { getBacklinkCompetitors } from "../../../helpers/data-for-seo/get-backlink-competitors.js"
import { createLogger } from "../../../helpers/logger.js"
import type {
  EmailSettings,
  ProspectCreatedPayload,
} from "../shared/prospect-types.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import {
  emptyStrategyFunnel,
  type StrategyResult,
} from "../shared/strategy-result.js"
import { extractDomainFromUrl } from "../shared/url-filters.js"
import {
  extractCompetitorDomain,
  isBlockedCompetitorDomain,
} from "./extract-backlinks.js"
import type { FilterSettings } from "./filter-backlinks.js"
import { processCompetitor } from "./process-competitor.js"
import type { CompetitorTargetPage } from "./match-target-page.js"
import {
  completeProspectRun,
  createProspectRun,
  failProspectRun,
  getLastCompetitorRefresh,
  selectCompetitorsForRun,
} from "./prospect-run-tracking.js"

const log = createLogger("discover-competitor-backlinks")

const MAX_PROSPECTS_PER_RUN = 20
const MAX_COMPETITORS_PER_RUN = 5

export type {
  EmailSettings,
  ProspectCreatedPayload,
} from "../shared/prospect-types.js"

export async function discoverCompetitorBacklinks(
  product: {
    id: string
    user_id: string
    product_name: string
    product_description: string
    website_url: string
    competitors: string[]
    target_keywords?: string[] | null
  },
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  limits: {
    maxCompetitors?: number
    maxProspects?: number
    fetchLimit?: number
    includeIntersection?: boolean
    refreshCompetitors?: boolean
    shouldStop?: () => boolean
  } = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void,
  enrichmentBudget?: { remaining: number }
): Promise<StrategyResult> {
  const maxCompetitors = limits.maxCompetitors ?? MAX_COMPETITORS_PER_RUN
  const maxProspects = limits.maxProspects ?? MAX_PROSPECTS_PER_RUN
  const fetchLimit = limits.fetchLimit

  log.info("discovery started", {
    productId: product.id,
    competitors: product.competitors.length,
  })

  if (product.competitors.length === 0 && limits.refreshCompetitors !== true) {
    log.info("no competitors set, skipping", { productId: product.id })
    const runId = await createProspectRun(product.id, [])
    if (runId)
      await completeProspectRun(
        runId,
        0,
        0,
        {},
        { skip_reason: "no_competitors_set" }
      )
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)

  const { data: rawTargetPages, error: targetPagesError } = await supabaseAdmin
    .from("product_pages")
    .select("id, url, title, priority, keywords, matched_keywords")
    .eq("product_id", product.id)
    .eq("crawl_status", "crawled")
    .eq("is_target", true)
    .order("priority", { ascending: true })

  if (targetPagesError) {
    log.warn("failed to load customer target pages", {
      productId: product.id,
      error: targetPagesError.message,
    })
  }
  const targetPages: CompetitorTargetPage[] = (rawTargetPages ?? []).map(
    (page) => ({
      id: page.id,
      url: page.url,
      title: page.title,
      priority: page.priority,
      keywords: page.keywords ?? [],
      matchedKeywords: page.matched_keywords ?? [],
    })
  )

  const configuredDomains = product.competitors
    .map(extractCompetitorDomain)
    .filter((domain) => domain && !isBlockedCompetitorDomain(domain))

  let competitorRefreshCostUsd = 0
  let competitorRefreshAt: string | null = null
  let inferredCompetitors: string[] = []
  let competitorRefreshFailed = false
  if (limits.refreshCompetitors === true) {
    const lastRefresh = await getLastCompetitorRefresh(product.id)
    inferredCompetitors = lastRefresh?.domains ?? []
    const refreshDue =
      !lastRefresh ||
      Date.now() - new Date(lastRefresh.refreshedAt).getTime() >=
        7 * 24 * 60 * 60 * 1_000
    const ownDomain = extractDomainFromUrl(product.website_url)
    if (refreshDue && ownDomain) {
      try {
        const refresh = await getBacklinkCompetitors(ownDomain)
        competitorRefreshCostUsd = refresh.costUsd
        competitorRefreshAt = new Date().toISOString()
        inferredCompetitors = refresh.domains.filter(
          (domain) => domain !== ownDomain && !isBlockedCompetitorDomain(domain)
        )
      } catch (error) {
        competitorRefreshFailed = true
        log.warn("competitor refresh failed", {
          productId: product.id,
          error: String(error),
        })
      }
    }
  }

  const allDomains = [
    ...new Set([...configuredDomains, ...inferredCompetitors]),
  ]

  if (allDomains.length === 0) {
    log.info("no valid competitors set, skipping", { productId: product.id })
    const runId = await createProspectRun(product.id, [])
    if (runId) {
      await completeProspectRun(
        runId,
        0,
        competitorRefreshCostUsd,
        {},
        {
          skip_reason: "no_valid_competitors",
          ...(competitorRefreshAt
            ? { competitor_refresh_at: competitorRefreshAt }
            : {}),
          ...(inferredCompetitors.length > 0
            ? { inferred_competitors: inferredCompetitors }
            : {}),
          transport_failures: competitorRefreshFailed ? 1 : 0,
        }
      )
    }
    return { prospectsCreated: 0, totalCostUsd: competitorRefreshCostUsd }
  }
  const competitorsToProcess = await selectCompetitorsForRun(
    product.id,
    allDomains,
    maxCompetitors
  )
  // Per-run fairness cap; total scraper pressure across runs is bounded by the
  // shared limiters in helpers/scraper-limits.ts.
  const enrichLimit = pLimit(5)

  log.info("competitors selected", {
    productId: product.id,
    selected: competitorsToProcess.length,
    total: allDomains.length,
  })

  const runId = await createProspectRun(product.id, competitorsToProcess)

  let totalProspectsCreated = 0
  let totalCostUsd = competitorRefreshCostUsd
  const mozCursorsByDomain: Record<string, string | null> = {}
  const exhaustedCompetitorDomains: string[] = []
  const funnel = {
    extracted: 0,
    passedFilters: 0,
    scoredTotal: 0,
    kept: 0,
    toEnrich: 0,
    enrichedWithContact: 0,
  }
  const commonFunnel = emptyStrategyFunnel()
  let intersectionCandidates = 0
  let transportFailures = competitorRefreshFailed ? 1 : 0

  try {
    for (const competitorDomain of competitorsToProcess) {
      if ((budget && budget.remaining <= 0) || limits.shouldStop?.()) {
        log.info("daily candidate cap reached, stopping competitor expansion", {
          productId: product.id,
          competitorsProcessed: Object.keys(mozCursorsByDomain).length,
        })
        break
      }
      const result = await processCompetitor(
        competitorDomain,
        product,
        settings,
        sender,
        emailSettings,
        enrichLimit,
        maxProspects,
        budget,
        onProspectCreated,
        fetchLimit,
        undefined,
        targetPages,
        enrichmentBudget
      )
      totalProspectsCreated += result.prospectsCreated
      totalCostUsd += result.costUsd
      transportFailures += result.transportFailures ?? 0
      mozCursorsByDomain[competitorDomain] = result.nextCursor
      if (result.nextCursor === null && result.funnel.extracted > 0) {
        exhaustedCompetitorDomains.push(competitorDomain)
      }
      funnel.extracted += result.funnel.extracted
      funnel.passedFilters += result.funnel.passedFilters
      funnel.scoredTotal += result.funnel.scoredTotal
      funnel.kept += result.funnel.kept
      funnel.toEnrich += result.funnel.toEnrich
      funnel.enrichedWithContact += result.funnel.enrichedWithContact
      if (result.persistence) {
        commonFunnel.prospectsInserted += result.persistence.prospectsInserted
        commonFunnel.contactReady += result.persistence.contactReady
        commonFunnel.emailNotFound += result.persistence.emailNotFound
        commonFunnel.enrichmentFailures += result.persistence.enrichmentFailures
        commonFunnel.persistenceFailures +=
          result.persistence.persistenceFailures
        commonFunnel.callbackFailures += result.persistence.callbackFailures
        commonFunnel.duplicatesSkipped += result.persistence.duplicatesSkipped
        commonFunnel.budgetSkipped += result.persistence.budgetSkipped
      }
    }

    // Once direct competitor pages stop filling the shared daily candidate
    // budget, use a single backlink-gap request to surface pages shared by
    // multiple competitors but not the customer's domain.
    if (
      limits.includeIntersection === true &&
      (!budget || budget.remaining > 0) &&
      !limits.shouldStop?.() &&
      allDomains.length >= 2
    ) {
      try {
        const ownDomain = extractDomainFromUrl(product.website_url)
        if (ownDomain) {
          const intersection = await getBacklinkPageIntersection(
            allDomains,
            ownDomain
          )
          totalCostUsd += intersection.costUsd
          intersectionCandidates = intersection.items.length

          const byCompetitor = new Map<string, typeof intersection.items>()
          for (const item of intersection.items) {
            const group = byCompetitor.get(item.competitorDomain) ?? []
            group.push(item)
            byCompetitor.set(item.competitorDomain, group)
          }

          for (const [competitorDomain, items] of byCompetitor) {
            if ((budget && budget.remaining <= 0) || limits.shouldStop?.())
              break
            const uniqueItems = [
              ...new Map(items.map((item) => [item.urlFrom, item])).values(),
            ]
            const result = await processCompetitor(
              competitorDomain,
              product,
              settings,
              sender,
              emailSettings,
              enrichLimit,
              maxProspects,
              budget,
              onProspectCreated,
              fetchLimit,
              { items: uniqueItems, nextCursor: null, costUsd: 0 },
              targetPages,
              enrichmentBudget
            )
            totalProspectsCreated += result.prospectsCreated
            totalCostUsd += result.costUsd
            transportFailures += result.transportFailures ?? 0
            funnel.extracted += result.funnel.extracted
            funnel.passedFilters += result.funnel.passedFilters
            funnel.scoredTotal += result.funnel.scoredTotal
            funnel.kept += result.funnel.kept
            funnel.toEnrich += result.funnel.toEnrich
            funnel.enrichedWithContact += result.funnel.enrichedWithContact
            if (result.persistence) {
              commonFunnel.prospectsInserted +=
                result.persistence.prospectsInserted
              commonFunnel.contactReady += result.persistence.contactReady
              commonFunnel.emailNotFound += result.persistence.emailNotFound
              commonFunnel.enrichmentFailures +=
                result.persistence.enrichmentFailures
              commonFunnel.persistenceFailures +=
                result.persistence.persistenceFailures
              commonFunnel.callbackFailures +=
                result.persistence.callbackFailures
              commonFunnel.duplicatesSkipped +=
                result.persistence.duplicatesSkipped
              commonFunnel.budgetSkipped += result.persistence.budgetSkipped
            }
          }
        }
      } catch (error) {
        transportFailures += 1
        log.warn("backlink intersection failed", {
          productId: product.id,
          error: String(error),
        })
      }
    }

    if (runId) {
      await completeProspectRun(
        runId,
        totalProspectsCreated,
        totalCostUsd,
        mozCursorsByDomain,
        {
          ...funnel,
          intersection_candidates: intersectionCandidates,
          transport_failures: transportFailures,
          ...(competitorRefreshAt
            ? { competitor_refresh_at: competitorRefreshAt }
            : {}),
          ...(inferredCompetitors.length > 0
            ? { inferred_competitors: inferredCompetitors }
            : {}),
          ...(exhaustedCompetitorDomains.length > 0
            ? { exhausted_competitor_domains: exhaustedCompetitorDomains }
            : {}),
        }
      )
    }
  } catch (err) {
    transportFailures += 1
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    if (runId) await failProspectRun(runId, msg)
  }

  log.info("run digest", {
    productId: product.id,
    competitorsProcessed: competitorsToProcess.length,
    competitorsSkipped: allDomains.length - competitorsToProcess.length,
    totalProspectsCreated,
    totalCostUsd: totalCostUsd.toFixed(4),
    nextCursors: mozCursorsByDomain,
  })

  return {
    prospectsCreated: totalProspectsCreated,
    totalCostUsd,
    funnel: {
      ...commonFunnel,
      candidatesGathered: funnel.extracted + intersectionCandidates,
      candidatesFetched: funnel.passedFilters,
      candidatesQualified: funnel.kept,
      enrichmentAttempts: funnel.toEnrich,
      prospectsInserted: totalProspectsCreated,
      contactReady: funnel.enrichedWithContact,
      transportFailures,
      exhausted:
        competitorsToProcess.length > 0 &&
        exhaustedCompetitorDomains.length === competitorsToProcess.length,
    },
  }
}
