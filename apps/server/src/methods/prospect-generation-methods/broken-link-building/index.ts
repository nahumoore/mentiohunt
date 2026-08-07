import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../../helpers/logger.js"
import { extractCompetitorDomain } from "../competitor-backlink/extract-backlinks.js"
import type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"
import { resolveSenderName } from "../shared/resolve-sender-name.js"
import type { FilterSettings } from "./filter-dead-link-candidates.js"
import { processCompetitor } from "./process-competitor.js"
import { completeProspectRun, createProspectRun, failProspectRun, selectCompetitorsForRun } from "./prospect-run-tracking.js"
import type { ReplacementPageCandidate } from "./types.js"

const log = createLogger("discover-broken-link-building")

const MAX_PROSPECTS_PER_RUN = 20
const MAX_COMPETITORS_PER_RUN = 3
const REPLACEMENT_PAGE_LIMIT = 30
// Landing pages excluded deliberately — nobody replaces a dead reference
// with a pricing page.
const ELIGIBLE_PAGE_TYPES = ["article", "resource", "free_tool"]

export type { EmailSettings, ProspectCreatedPayload } from "../shared/prospect-types.js"

export async function discoverBrokenLinkBuilding(
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
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const { data: rawPages, error: pagesError } = await supabaseAdmin
    .from("product_pages")
    .select("id, url, title, description, page_type, priority, keywords")
    .eq("product_id", product.id)
    .eq("crawl_status", "crawled")
    .in("page_type", ELIGIBLE_PAGE_TYPES)
    .order("priority", { ascending: false })
    .limit(REPLACEMENT_PAGE_LIMIT)

  if (pagesError) {
    log.error("failed to load replacement pages", { productId: product.id, error: pagesError.message })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const replacementPages: ReplacementPageCandidate[] = (rawPages ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    title: p.title,
    description: p.description,
    page_type: p.page_type,
    priority: p.priority,
    keywords: p.keywords ?? [],
  }))

  if (replacementPages.length === 0) {
    log.info("no crawled replacement pages, skipping", { productId: product.id })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)

  const allDomains = product.competitors.map(extractCompetitorDomain)
  const competitorsToProcess = await selectCompetitorsForRun(product.id, allDomains, maxCompetitors)
  const enrichLimit = pLimit(5)

  log.info("competitors selected", {
    productId: product.id,
    selected: competitorsToProcess.length,
    total: allDomains.length,
    replacementPages: replacementPages.length,
  })

  const runId = await createProspectRun(product.id, competitorsToProcess)

  let totalProspectsCreated = 0
  let totalCostUsd = 0
  const cursorsByDomain: Record<string, string | null> = {}

  try {
    for (const competitorDomain of competitorsToProcess) {
      const result = await processCompetitor(
        competitorDomain,
        product,
        settings,
        replacementPages,
        sender,
        emailSettings,
        enrichLimit,
        maxProspects,
        budget,
        onProspectCreated,
        fetchLimit
      )
      totalProspectsCreated += result.prospectsCreated
      totalCostUsd += result.costUsd
      cursorsByDomain[competitorDomain] = result.nextCursor
    }

    if (runId) await completeProspectRun(runId, totalProspectsCreated, totalCostUsd, cursorsByDomain)
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
    nextCursors: cursorsByDomain,
  })

  return { prospectsCreated: totalProspectsCreated, totalCostUsd }
}
