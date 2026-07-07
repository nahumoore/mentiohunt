import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit, { type LimitFunction } from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { scoreSiteRelevance } from "../shared/score-site-relevance.js"
import { enrichContact } from "./enrich-contact.js"
import { extractBacklinks, extractCompetitorDomain } from "./extract-backlinks.js"
import { filterBacklinks, extractDomainFromUrl, type TaggedBacklinkItem, type FilterSettings } from "./filter-backlinks.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { scoreBacklinkRelevance, type ScoredBacklinkItem } from "./score-backlink-relevance.js"
import { resolveSenderName, type ResolvedSender } from "../shared/resolve-sender-name.js"

const log = createLogger("discover-competitor-backlinks")

const MIN_RELEVANCE_SCORE = 3
const MAX_PROSPECTS_PER_RUN = 20
const MAX_COMPETITORS_PER_RUN = 3

export type EmailSettings = {
  voice_tone?: string | null
  offering?: string | null
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

export type ProspectCreatedPayload = {
  id: string
  contactName: string | null
  emailSubject: string | null
  emailBody: string | null
  step2Body: string | null
  step3Body: string | null
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
 * Resolve contact + email draft for a prospect. Returns the columns to persist
 * as an update against the already-inserted bare prospect row.
 */
async function enrichProspect(
  item: ScoredBacklinkItem,
  product: { product_name: string; product_description: string; website_url: string },
  domain: string,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  try {
    const contact = await enrichContact(item.urlFrom, item.pageType, domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

    if (!contact.email) {
      log.info("contact name without email", { domain, contactName: contact.name })
      return {
        contact_name: contact.name,
        contact_email: null,
        contact_social_links: social,
        email_subject: null,
        email_body: null,
        step2_body: null,
        step3_body: null,
        raw_metadata: {
          ...(contact.rawMetadata ?? {}),
          outreach_context: {
            opportunityType: "competitor_backlink",
            title: item.title,
            anchor: item.anchor,
            pageType: item.pageType,
            competitorDomain: item.competitorDomain,
          },
        },
      }
    }

    const emailResult = await generateOutreachSequence(
      product,
      {
        opportunityType: "competitor_backlink",
        title: item.title,
        anchor: item.anchor,
        pageType: item.pageType,
        competitorDomain: item.competitorDomain,
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
      domain,
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
    log.warn("prospect enrichment failed", { domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT }
  }
}

async function getLastMozCursor(
  productId: string,
  competitorDomain: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("metadata")
    .eq("product_id", productId)
    .eq("strategy", "competitor_backlink")
    .eq("status", "completed")
    .contains("input" as string, { competitor_domains: [competitorDomain] })
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const metadata = (data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? null
  const mozCursors = (metadata?.moz_cursors as Record<string, string> | null) ?? {}
  return mozCursors[competitorDomain] ?? null
}

async function selectCompetitorsForRun(
  productId: string,
  allDomains: string[],
  maxCompetitors: number
): Promise<string[]> {
  const { data: recentRuns } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("input, completed_at")
    .eq("product_id", productId)
    .eq("strategy", "competitor_backlink")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const lastRunByDomain = new Map<string, string>()
  for (const run of (recentRuns ?? []) as Array<{ input: { competitor_domains?: string[] } | null; completed_at: string | null }>) {
    for (const domain of run.input?.competitor_domains ?? []) {
      if (!lastRunByDomain.has(domain)) {
        lastRunByDomain.set(domain, run.completed_at ?? "")
      }
    }
  }

  return [...allDomains]
    .sort((a, b) => {
      const aTime = lastRunByDomain.get(a) ?? ""
      const bTime = lastRunByDomain.get(b) ?? ""
      return aTime < bTime ? -1 : 1
    })
    .slice(0, maxCompetitors)
}

async function createProspectRun(productId: string, competitorDomains: string[]): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({
      product_id: productId,
      strategy: "competitor_backlink",
      input: { competitor_domains: competitorDomains },
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

async function completeProspectRun(
  runId: string,
  prospectsCreated: number,
  costUsd: number,
  mozCursorsByDomain: Record<string, string | null>
): Promise<void> {
  const validCursors = Object.fromEntries(
    Object.entries(mozCursorsByDomain).filter(([, v]) => v !== null)
  )
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
      metadata: Object.keys(validCursors).length > 0 ? { moz_cursors: validCursors } : null,
    })
    .eq("id", runId)
}

async function failProspectRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}

async function processCompetitor(
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

    // Insert bare rows immediately so the UI shows discovered sites right
    // away; enrichment (contact + outreach email) fills each row in after.
    const bareRows = toProcess.map((item) => {
      const domain = extractDomainFromUrl(item.urlFrom)
      const sr = siteRelevanceResults.get(item.urlFrom)
      return {
        product_id: product.id,
        domain,
        domain_rating: item.domainRating,
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
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  const sender = await resolveSenderName(product.user_id)

  const allDomains = product.competitors.map(extractCompetitorDomain)
  const competitorsToProcess = await selectCompetitorsForRun(product.id, allDomains, maxCompetitors)
  const enrichLimit = pLimit(1)

  log.info("competitors selected", {
    productId: product.id,
    selected: competitorsToProcess.length,
    total: allDomains.length,
  })

  const runId = await createProspectRun(product.id, competitorsToProcess)

  let totalProspectsCreated = 0
  let totalCostUsd = 0
  const mozCursorsByDomain: Record<string, string | null> = {}

  try {
    for (const competitorDomain of competitorsToProcess) {
      const result = await processCompetitor(competitorDomain, product, settings, sender, emailSettings, enrichLimit, maxProspects, budget, onProspectCreated, fetchLimit)
      totalProspectsCreated += result.prospectsCreated
      totalCostUsd += result.costUsd
      mozCursorsByDomain[competitorDomain] = result.nextCursor
    }

    if (runId) await completeProspectRun(runId, totalProspectsCreated, totalCostUsd, mozCursorsByDomain)
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
