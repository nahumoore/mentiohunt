import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { enrichContact } from "./enrich-contact.js"
import { extractBacklinks, extractCompetitorDomain } from "./extract-backlinks.js"
import { filterBacklinks, extractDomainFromUrl, type TaggedBacklinkItem, type FilterSettings } from "./filter-backlinks.js"
import { generateBacklinkEmail } from "./generate-backlink-email.js"
import { scoreBacklinkRelevance, type ScoredBacklinkItem } from "./score-backlink-relevance.js"

const log = createLogger("discover-competitor-backlinks")

const MIN_RELEVANCE_SCORE = 3

type RawPostText = {
  anchor: string
  domainRating: number
  pageTitle: string
  pageType: string
  relevanceScore: number
  relevanceReason: string
  competitorDomain: string
  textPre: string
  textPost: string
  contactConfidence: string | null
}

async function prefilterExistingDomains(
  productId: string,
  domains: string[]
): Promise<Set<string>> {
  if (domains.length === 0) return new Set()

  const { data, error } = await supabaseAdmin
    .from("backlink_prospects")
    .select("domain")
    .eq("product_id", productId)
    .eq("tier", "competitor_backlink")
    .in("domain", domains)

  if (error) {
    log.warn("prefilter query failed, skipping", { productId, error: error.message })
    return new Set()
  }

  return new Set(
    (data ?? []).map((r) => r.domain).filter((d): d is string => d !== null)
  )
}

async function runBackgroundEnrichment(
  rowId: string,
  item: ScoredBacklinkItem,
  product: { product_name: string; product_description: string; website_url: string },
  domain: string
): Promise<void> {
  try {
    const contact = await enrichContact(item.urlFrom, item.pageType, domain)

    const urlToPath = (() => {
      try { return new URL(item.urlTo).pathname } catch { return item.urlTo }
    })()

    const emailResult = await generateBacklinkEmail(product, {
      title: item.title,
      anchor: item.anchor,
      urlToPath,
      pageType: item.pageType,
      contactName: contact.name,
      competitorDomain: item.competitorDomain,
    })

    const rawText: RawPostText = {
      anchor: item.anchor,
      domainRating: item.domainRating,
      pageTitle: item.title,
      pageType: item.pageType,
      relevanceScore: item.relevanceScore,
      relevanceReason: item.relevanceReason,
      competitorDomain: item.competitorDomain,
      textPre: item.textPre,
      textPost: item.textPost,
      contactConfidence: contact.confidence,
    }

    const { error: updateError } = await supabaseAdmin
      .from("backlink_prospects")
      .update({
        contact_name: contact.name,
        contact_email: contact.email,
        email_subject: emailResult?.subject ?? null,
        email_body: emailResult?.body ?? null,
        raw_post_text: JSON.stringify(rawText),
      })
      .eq("id", rowId)

    if (updateError) {
      log.warn("enrichment DB update failed", { rowId, domain, error: updateError.message })
      return
    }

    log.success("enrichment complete", {
      rowId,
      domain,
      contactConfidence: contact.confidence,
      hasEmail: !!contact.email,
      hasEmailDraft: !!emailResult,
    })
  } catch (err) {
    log.warn("background enrichment failed", { rowId, domain, error: String(err) })
  }
}

export async function discoverCompetitorBacklinks(
  product: {
    id: string
    product_name: string
    product_description: string
    website_url: string
    competitors: string[]
  },
  settings: FilterSettings
): Promise<{ prospectsCreated: number; totalCostUsd: number }> {
  log.info("discovery started", { productId: product.id, competitors: product.competitors.length })

  if (product.competitors.length === 0) {
    log.info("no competitors set, skipping", { productId: product.id })
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  // Phase 1: extract backlinks per competitor (concurrency 3)
  const extractLimit = pLimit(3)
  const extractResults = await Promise.all(
    product.competitors.map((competitorUrl) =>
      extractLimit(async () => {
        const domain = extractCompetitorDomain(competitorUrl)
        log.info("extracting competitor backlinks", { productId: product.id, competitorDomain: domain })
        const items = await extractBacklinks(domain)
        log.info("competitor extraction done", { productId: product.id, competitorDomain: domain, count: items.length })
        return items.map((item): TaggedBacklinkItem => ({ ...item, competitorDomain: domain }))
      })
    )
  )

  const allItems = extractResults.flat()
  log.info("extraction complete", {
    productId: product.id,
    competitors: product.competitors.length,
    total: allItems.length,
  })

  // Phase 2: pre-filter
  const filtered = filterBacklinks(allItems, settings)
  log.info("pre-filter complete", { productId: product.id, filtered: filtered.length })

  if (filtered.length === 0) {
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  // Phase 3: dedup against existing DB rows
  const allDomains = filtered.map((item) => extractDomainFromUrl(item.urlFrom))
  const existingDomains = await prefilterExistingDomains(product.id, allDomains)

  const fresh = filtered.filter(
    (item) => !existingDomains.has(extractDomainFromUrl(item.urlFrom))
  )
  log.info("db dedup complete", {
    productId: product.id,
    existing: existingDomains.size,
    fresh: fresh.length,
  })

  if (fresh.length === 0) {
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }

  // Phase 4: relevance scoring
  const { results: scored, totalCost } = await scoreBacklinkRelevance(fresh, product)
  const passing = scored.filter((r) => r.relevanceScore >= MIN_RELEVANCE_SCORE)

  log.info("scoring complete", {
    productId: product.id,
    scored: scored.length,
    passing: passing.length,
  })

  if (passing.length === 0) {
    return { prospectsCreated: 0, totalCostUsd: totalCost }
  }

  // Phase 5: build and upsert rows (without contact/email — enrichment runs async)
  const rows = passing.map((item) => {
    const domain = extractDomainFromUrl(item.urlFrom)
    const rawText: RawPostText = {
      anchor: item.anchor,
      domainRating: item.domainRating,
      pageTitle: item.title,
      pageType: item.pageType,
      relevanceScore: item.relevanceScore,
      relevanceReason: item.relevanceReason,
      competitorDomain: item.competitorDomain,
      textPre: item.textPre,
      textPost: item.textPost,
      contactConfidence: null,
    }

    return {
      product_id: product.id,
      domain,
      found_url: item.urlFrom,
      target_url: item.urlTo,
      tier: "competitor_backlink" as const,
      action_type: "email_outreach" as const,
      status: "new" as const,
      raw_post_text: JSON.stringify(rawText),
    }
  })

  const { data: inserted, error: upsertError } = await supabaseAdmin
    .from("backlink_prospects")
    .upsert(rows, { ignoreDuplicates: true })
    .select("id, domain, found_url")

  if (upsertError) {
    log.error("upsert failed", { productId: product.id, error: upsertError.message })
    return { prospectsCreated: 0, totalCostUsd: totalCost }
  }

  const insertedRows = inserted ?? []
  log.info("rows upserted", { productId: product.id, count: insertedRows.length })

  if (insertedRows.length === 0) {
    return { prospectsCreated: 0, totalCostUsd: totalCost }
  }

  // Phase 6: background enrichment
  const scoredByFoundUrl = new Map(passing.map((item) => [item.urlFrom, item]))
  const enrichLimit = pLimit(5)

  void Promise.allSettled(
    insertedRows.map((row) =>
      enrichLimit(async () => {
        const item = scoredByFoundUrl.get(row.found_url ?? "")
        if (!item || !row.id) return
        const domain = extractDomainFromUrl(item.urlFrom)
        await runBackgroundEnrichment(row.id, item, product, domain)
      })
    )
  )

  log.info("discovery complete — enrichment running in background", {
    productId: product.id,
    prospectsCreated: insertedRows.length,
  })

  return { prospectsCreated: insertedRows.length, totalCostUsd: totalCost }
}
