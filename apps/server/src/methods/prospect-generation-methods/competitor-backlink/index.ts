import pLimit from "p-limit"
import { createLogger } from "../../../helpers/logger.js"
import type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import { extractCompetitorDomain } from "./extract-backlinks.js"
import type { FilterSettings } from "./filter-backlinks.js"
import { processCompetitor } from "./process-competitor.js"
import { completeProspectRun, createProspectRun, failProspectRun, selectCompetitorsForRun } from "./prospect-run-tracking.js"

const log = createLogger("discover-competitor-backlinks")

const MAX_PROSPECTS_PER_RUN = 20
const MAX_COMPETITORS_PER_RUN = 3

export type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"

export async function discoverCompetitorBacklinks(
  product: {
    id: string
    user_id: string
    product_name: string
    product_description: string
    website_url: string
    competitors: string[]
  },
  settings: FilterSettings,
  emailSettings: EmailSettings = {},
  limits: { maxCompetitors?: number; maxProspects?: number; fetchLimit?: number } = {},
  budget?: { remaining: number },
  onProspectCreated?: (p: ProspectCreatedPayload) => void
): Promise<{ prospectsCreated: number; totalCostUsd: number }> {
  const maxCompetitors = limits.maxCompetitors ?? MAX_COMPETITORS_PER_RUN
  const maxProspects = limits.maxProspects ?? MAX_PROSPECTS_PER_RUN
  const fetchLimit = limits.fetchLimit

  log.info("discovery started", { productId: product.id, competitors: product.competitors.length })

  if (product.competitors.length === 0) {
    log.info("no competitors set, skipping", { productId: product.id })
    const runId = await createProspectRun(product.id, [])
    if (runId) await completeProspectRun(runId, 0, 0, {}, { skip_reason: "no_competitors_set" })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)

  const allDomains = product.competitors.map(extractCompetitorDomain)
  const competitorsToProcess = await selectCompetitorsForRun(product.id, allDomains, maxCompetitors)
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
  let totalCostUsd = 0
  const mozCursorsByDomain: Record<string, string | null> = {}
  const funnel = { extracted: 0, passedFilters: 0, scoredTotal: 0, kept: 0, toEnrich: 0, enrichedWithContact: 0 }

  try {
    for (const competitorDomain of competitorsToProcess) {
      const result = await processCompetitor(competitorDomain, product, settings, sender, emailSettings, enrichLimit, maxProspects, budget, onProspectCreated, fetchLimit)
      totalProspectsCreated += result.prospectsCreated
      totalCostUsd += result.costUsd
      mozCursorsByDomain[competitorDomain] = result.nextCursor
      funnel.extracted += result.funnel.extracted
      funnel.passedFilters += result.funnel.passedFilters
      funnel.scoredTotal += result.funnel.scoredTotal
      funnel.kept += result.funnel.kept
      funnel.toEnrich += result.funnel.toEnrich
      funnel.enrichedWithContact += result.funnel.enrichedWithContact
    }

    if (runId) await completeProspectRun(runId, totalProspectsCreated, totalCostUsd, mozCursorsByDomain, funnel)
  } catch (err) {
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

  return { prospectsCreated: totalProspectsCreated, totalCostUsd }
}
