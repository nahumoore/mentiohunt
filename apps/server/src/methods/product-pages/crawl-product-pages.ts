import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { fetchSitemapUrls, filterContentUrls } from "../../helpers/sitemap.js"
import { fetchPageContent } from "../../helpers/scraper-content-client.js"
import { createLogger } from "../../helpers/logger.js"
import { categorizePages, type PageToClassify } from "./categorize-pages.js"
import { discoverSitemapUrls } from "./discover-sitemap.js"
import { rankCandidateUrls } from "./rank-candidate-urls.js"

const log = createLogger("crawl-product-pages")

const CRAWL_CONCURRENCY = 10
const DEFAULT_KEEP_TOP = 5

export type CrawlProductPagesResult = {
  candidatesFound: number
  pagesCrawled: number
  pagesSelected: number
  pagesFailed: number
  totalCostUsd: number
}

const EMPTY_RESULT: CrawlProductPagesResult = {
  candidatesFound: 0,
  pagesCrawled: 0,
  pagesSelected: 0,
  pagesFailed: 0,
  totalCostUsd: 0,
}

/** relevanceScore (0-100) -> product_pages.priority (1-5), floored to 3 for selected targets so
 *  resource_page_inclusion's default `priority >= 3` gate isn't silently starved. */
function scoreToPriority(score: number): number {
  const bucket = score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1
  return Math.max(bucket, 3)
}

export async function crawlProductPages(
  productId: string,
  options: { crawlLimit: number; keepTop?: number }
): Promise<CrawlProductPagesResult> {
  const { crawlLimit, keepTop = DEFAULT_KEEP_TOP } = options
  log.info("START", { productId, crawlLimit, keepTop })

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description, website_url, target_keywords")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    throw new Error(`Could not load product ${productId}: ${productError?.message}`)
  }

  const targetKeywords = product.target_keywords ?? []
  if (targetKeywords.length === 0) {
    log.info("no target keywords set, skipping selection", { productId })
    return EMPTY_RESULT
  }

  // Discover + expand the sitemap. Always keep the homepage as a candidate
  // even if sitemap discovery fails entirely or omits it.
  const sitemapUrls = await discoverSitemapUrls(product.website_url)
  const rawUrls: string[] = [product.website_url]
  for (const sitemapUrl of sitemapUrls) {
    try {
      rawUrls.push(...(await fetchSitemapUrls(sitemapUrl)))
    } catch (err) {
      log.warn("sitemap fetch failed, skipping", { url: sitemapUrl, error: String(err) })
    }
  }

  const filtered = filterContentUrls(rawUrls)
  const candidates = rankCandidateUrls(filtered, targetKeywords, crawlLimit)

  log.info("candidates ranked", {
    sitemapsFound: sitemapUrls.length,
    rawUrls: rawUrls.length,
    afterFilter: filtered.length,
    candidates: candidates.length,
  })

  if (candidates.length === 0) {
    log.info("no candidate URLs, skipping")
    return EMPTY_RESULT
  }

  // Crawl candidates concurrently
  type CrawledPage = PageToClassify & { crawlFailed: boolean }

  const limit = pLimit(CRAWL_CONCURRENCY)
  const crawled: CrawledPage[] = await Promise.all(
    candidates.map((url) =>
      limit(async () => {
        try {
          const scraped = await fetchPageContent(url)
          if (!scraped) throw new Error("scraper returned null")
          const { title, description, text } = scraped
          return { url, title, description, text, crawlFailed: false }
        } catch (err) {
          log.warn("page crawl failed", { url, error: String(err) })
          return { url, title: "", description: "", text: "", crawlFailed: true }
        }
      })
    )
  )

  const succeeded = crawled.filter((p) => !p.crawlFailed)
  const failed = crawled.filter((p) => p.crawlFailed)

  log.info("crawl complete", { total: crawled.length, ok: succeeded.length, failed: failed.length })

  const { results: categorized, totalCost } = await categorizePages(
    succeeded,
    { product_name: product.product_name, product_description: product.product_description },
    targetKeywords
  )

  const top = [...categorized].sort((a, b) => b.relevanceScore - a.relevanceScore).slice(0, keepTop)

  log.info("top pages selected", {
    productId,
    selected: top.map((t) => ({ url: t.url, relevanceScore: t.relevanceScore })),
  })

  await reconcileTargetPages(productId, top)

  log.info("done", {
    productId,
    candidatesFound: candidates.length,
    pagesCrawled: succeeded.length,
    pagesSelected: top.length,
    pagesFailed: failed.length,
    cost_usd: totalCost.toFixed(4),
  })

  return {
    candidatesFound: candidates.length,
    pagesCrawled: succeeded.length,
    pagesSelected: top.length,
    pagesFailed: failed.length,
    totalCostUsd: totalCost,
  }
}

type SelectedPage = {
  url: string
  pageType: string
  keywords: string[]
  relevanceScore: number
  matchedKeywords: string[]
  reason: string
}

/**
 * Upserts the new top-N pages as targets. Previously-targeted auto pages that
 * fell out of the top N are soft-retired (is_target: false) if they have any
 * backlink_prospects attached — deleting them would null the prospect's FK
 * and silently zero its opportunity count — otherwise deleted. Manually
 * added pages (is_manual) are never touched.
 */
async function reconcileTargetPages(productId: string, top: SelectedPage[]): Promise<void> {
  const now = new Date().toISOString()

  if (top.length > 0) {
    const toUpsert = top.map((p) => ({
      product_id: productId,
      url: p.url,
      page_type: p.pageType,
      keywords: p.keywords,
      relevance_score: p.relevanceScore,
      matched_keywords: p.matchedKeywords,
      selection_reason: p.reason || null,
      priority: scoreToPriority(p.relevanceScore),
      is_target: true,
      is_manual: false,
      crawl_status: "crawled" as const,
      crawled_at: now,
    }))

    const { error: upsertError } = await supabaseAdmin
      .from("product_pages")
      .upsert(toUpsert, { onConflict: "product_id,url" })

    if (upsertError) {
      log.error("failed to upsert selected pages", { error: upsertError.message })
    }
  }

  const selectedUrls = new Set(top.map((p) => p.url))

  const { data: existingTargets, error: existingError } = await supabaseAdmin
    .from("product_pages")
    .select("id, url")
    .eq("product_id", productId)
    .eq("is_target", true)
    .eq("is_manual", false)

  if (existingError) {
    log.warn("failed to load existing target pages for reconciliation", { error: existingError.message })
    return
  }

  const fallenOut = (existingTargets ?? []).filter((p) => !selectedUrls.has(p.url))
  if (fallenOut.length === 0) return

  const fallenOutIds = fallenOut.map((p) => p.id)
  const { data: attachedProspects, error: prospectsError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("product_page_id")
    .in("product_page_id", fallenOutIds)

  if (prospectsError) {
    log.warn("failed to check attached prospects, leaving fallen-out pages untouched", {
      error: prospectsError.message,
    })
    return
  }

  const idsWithProspects = new Set((attachedProspects ?? []).map((p) => p.product_page_id))
  const toRetire = fallenOutIds.filter((id) => idsWithProspects.has(id))
  const toDelete = fallenOutIds.filter((id) => !idsWithProspects.has(id))

  if (toRetire.length > 0) {
    const { error } = await supabaseAdmin
      .from("product_pages")
      .update({ is_target: false })
      .in("id", toRetire)
    if (error) log.warn("failed to soft-retire pages", { error: error.message })
  }

  if (toDelete.length > 0) {
    const { error } = await supabaseAdmin.from("product_pages").delete().in("id", toDelete)
    if (error) log.warn("failed to delete fallen-out pages", { error: error.message })
  }

  log.info("reconciled target pages", { retired: toRetire.length, deleted: toDelete.length })
}
