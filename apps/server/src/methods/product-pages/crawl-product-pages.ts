import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { fetchSitemapUrls, filterContentUrls } from "../../helpers/sitemap.js"
import { fetchPageContent } from "../../helpers/scraper-content-client.js"
import { createLogger } from "../../helpers/logger.js"
import { categorizePages, type PageToClassify } from "./categorize-pages.js"
import { heuristicPageCategories } from "./heuristic-page-category.js"
import { discoverSitemapUrls } from "./discover-sitemap.js"
import { rankCandidateUrls } from "./rank-candidate-urls.js"

const log = createLogger("crawl-product-pages")

const CRAWL_CONCURRENCY = 10
// Mirrors MAX_TRACKED_PAGES in apps/web/consts/billing.ts — server code can't
// import from apps/web, so keep both at 5 if this changes.
const DEFAULT_KEEP_TOP = 5
// Preview mode only: categorizing every crawled candidate buys nothing when
// only `keepTop` (5) can ever be selected as a target page — cap the LLM
// pass to the candidates the heuristic ranker already thinks are best, and
// heuristically categorize the rest instead of spending an LLM call on them.
const PREVIEW_CATEGORIZE_LIMIT = 12
const PREVIEW_RETRY_DELAYS_MS = [3_000]

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

export async function crawlProductPages(
  productId: string,
  options: {
    crawlLimit: number
    keepTop?: number
    autoDiscover?: boolean
    previewMode?: boolean
    /**
     * Fires at most once, as soon as target pages exist and are persisted
     * with `crawl_status: 'crawled'` — either from the manual-page branch or
     * from `reconcileTargetPages` at the end of auto-discovery, whichever
     * happens first. Lets callers (see run-onboarding-jobs.ts) start
     * resource-page/broken-link discovery without waiting for the full
     * categorization pass to finish.
     */
    onTargetPagesReady?: (pagesSelected: number) => void
  }
): Promise<CrawlProductPagesResult> {
  const { crawlLimit, keepTop = DEFAULT_KEEP_TOP, autoDiscover = true, previewMode = false } = options
  log.info("START", { productId, crawlLimit, keepTop, autoDiscover, previewMode })

  let targetPagesSignaled = false
  function signalTargetPagesReady(pagesSelected: number) {
    if (targetPagesSignaled || pagesSelected === 0) return
    targetPagesSignaled = true
    options.onTargetPagesReady?.(pagesSelected)
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description, website_url, target_keywords")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    throw new Error(`Could not load product ${productId}: ${productError?.message}`)
  }

  const targetKeywords = product.target_keywords ?? []

  // Pages the customer pasted during onboarding (or added manually since).
  // These are never sitemap-ranked or truncated to keepTop — they're
  // authoritative — but still need a crawl + categorization pass so
  // matched_keywords/relevance_score are populated for stage 2 discovery.
  const { data: manualTargets, error: manualError } = await supabaseAdmin
    .from("product_pages")
    .select("id, url, priority")
    .eq("product_id", productId)
    .eq("is_manual", true)
    .eq("is_target", true)

  if (manualError) {
    log.warn("failed to load manual target pages", { error: manualError.message })
  }

  const manualUrls = manualTargets ?? []

  if (manualUrls.length === 0 && targetKeywords.length === 0) {
    log.info("no manual pages and no target keywords set, skipping selection", { productId })
    return EMPTY_RESULT
  }

  const limit = pLimit(CRAWL_CONCURRENCY)

  let manualCrawled = 0
  let manualFailed = 0
  let manualCost = 0

  if (manualUrls.length > 0) {
    type CrawledManualPage = PageToClassify & { id: string; crawlFailed: boolean }

    const crawledManual: CrawledManualPage[] = await Promise.all(
      manualUrls.map((p) =>
        limit(async () => {
          try {
            const scraped = await fetchPageContent(p.url)
            if (!scraped) throw new Error("scraper returned null")
            const { title, description, text } = scraped
            return { id: p.id, url: p.url, title, description, text, crawlFailed: false }
          } catch (err) {
            log.warn("manual page crawl failed", { url: p.url, error: String(err) })
            return { id: p.id, url: p.url, title: "", description: "", text: "", crawlFailed: true }
          }
        })
      )
    )

    const succeededManual = crawledManual.filter((p) => !p.crawlFailed)
    manualFailed = crawledManual.length - succeededManual.length
    manualCrawled = succeededManual.length

    log.info("manual pages crawled", { total: crawledManual.length, ok: succeededManual.length, failed: manualFailed })

    if (succeededManual.length > 0) {
      const { results: categorized, totalCost } = await categorizePages(
        succeededManual,
        { product_name: product.product_name, product_description: product.product_description },
        targetKeywords,
        previewMode ? { retryDelaysMs: PREVIEW_RETRY_DELAYS_MS } : {}
      )
      manualCost = totalCost

      const categorizedByUrl = new Map(categorized.map((c) => [c.url, c]))
      const now = new Date().toISOString()

      // page_type/priority/is_manual/is_target came from the onboarding
      // form (or /api/pages) and are left untouched here, same as the
      // single-page crawl route (routes/crawl-single-page.ts).
      await Promise.all(
        succeededManual.map(async (p) => {
          const cat = categorizedByUrl.get(p.url)
          const { error } = await supabaseAdmin
            .from("product_pages")
            .update({
              title: p.title || null,
              description: p.description || null,
              keywords: cat?.keywords ?? [],
              relevance_score: cat?.relevanceScore ?? null,
              matched_keywords: cat?.matchedKeywords ?? [],
              selection_reason: cat?.reason || null,
              crawl_status: "crawled",
              crawled_at: now,
            })
            .eq("id", p.id)
          if (error) {
            log.warn("failed to update manual page after crawl", { url: p.url, error: error.message })
          }
        })
      )

      // These rows are now is_target + crawl_status='crawled' — stage 2
      // discovery (resource pages, broken links) can start immediately
      // instead of waiting for auto-discovery's categorization pass.
      signalTargetPagesReady(succeededManual.length)
    }
  }

  let candidatesFound = 0
  let autoCrawled = 0
  let autoFailed = 0
  let autoCost = 0
  let top: SelectedPage[] = []

  const remaining = keepTop - manualUrls.length

  if (autoDiscover && remaining > 0 && targetKeywords.length > 0) {
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

    const manualUrlSet = new Set(manualUrls.map((p) => p.url))
    const filtered = filterContentUrls(rawUrls).filter((url) => !manualUrlSet.has(url))
    const candidates = rankCandidateUrls(filtered, targetKeywords, crawlLimit)
    candidatesFound = candidates.length

    log.info("candidates ranked", {
      sitemapsFound: sitemapUrls.length,
      rawUrls: rawUrls.length,
      afterFilter: filtered.length,
      candidates: candidates.length,
      remaining,
    })

    if (candidates.length > 0) {
      // Crawl candidates concurrently
      type CrawledPage = PageToClassify & { crawlFailed: boolean }

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
      autoFailed = crawled.length - succeeded.length
      autoCrawled = succeeded.length

      log.info("crawl complete", { total: crawled.length, ok: succeeded.length, failed: autoFailed })

      // `succeeded` is already best-first (it was crawled in `candidates`
      // order, which rankCandidateUrls sorted by heuristic score) — in
      // preview mode only the top slice is worth an LLM categorization call
      // since at most `remaining` (≤ keepTop) can ever become a target page.
      const toCategorizeWithLlm = previewMode
        ? succeeded.slice(0, PREVIEW_CATEGORIZE_LIMIT)
        : succeeded
      const heuristicOnly = previewMode ? succeeded.slice(PREVIEW_CATEGORIZE_LIMIT) : []

      const { results: llmCategorized, totalCost } = await categorizePages(
        toCategorizeWithLlm,
        { product_name: product.product_name, product_description: product.product_description },
        targetKeywords,
        previewMode ? { retryDelaysMs: PREVIEW_RETRY_DELAYS_MS } : {}
      )
      autoCost = totalCost

      const categorized =
        heuristicOnly.length > 0
          ? [...llmCategorized, ...heuristicPageCategories(heuristicOnly, targetKeywords)]
          : llmCategorized

      const crawledByUrl = new Map(succeeded.map((p) => [p.url, p]))

      top = [...categorized]
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, remaining)
        .map((p) => ({
          ...p,
          title: crawledByUrl.get(p.url)?.title || null,
          description: crawledByUrl.get(p.url)?.description || null,
        }))

      log.info("top pages selected", {
        productId,
        selected: top.map((t) => ({ url: t.url, relevanceScore: t.relevanceScore })),
      })
    } else {
      log.info("no candidate URLs, skipping auto-discovery")
    }
  } else {
    log.info("auto-discovery skipped", { autoDiscover, remaining, hasKeywords: targetKeywords.length > 0 })
  }

  const usedPriorities = new Set(manualUrls.map((p) => p.priority))
  await reconcileTargetPages(productId, top, usedPriorities)
  signalTargetPagesReady(manualUrls.length + top.length)

  const result: CrawlProductPagesResult = {
    candidatesFound,
    pagesCrawled: manualCrawled + autoCrawled,
    pagesSelected: manualUrls.length + top.length,
    pagesFailed: manualFailed + autoFailed,
    totalCostUsd: manualCost + autoCost,
  }

  log.info("done", { productId, ...result, cost_usd: result.totalCostUsd.toFixed(4) })

  return result
}

type SelectedPage = {
  url: string
  pageType: string
  keywords: string[]
  relevanceScore: number
  matchedKeywords: string[]
  reason: string
  title: string | null
  description: string | null
}

/**
 * Upserts the new top-N pages as targets. Previously-targeted auto pages that
 * fell out of the top N are soft-retired (is_target: false) if they have any
 * backlink_prospects attached — deleting them would null the prospect's FK
 * and silently zero its opportunity count — otherwise deleted. Manually
 * added pages (is_manual) are never touched.
 *
 * `top` is already sorted best-first (relevanceScore desc). Priority is now
 * user-facing intent (1 = highest, matching target_keywords' array-index
 * convention), not a derived score bucket, so auto-selected pages are handed
 * the lowest-numbered slots not already claimed by a manually-ranked page —
 * best auto page gets the best free slot.
 */
async function reconcileTargetPages(
  productId: string,
  top: SelectedPage[],
  usedPriorities: Set<number>
): Promise<void> {
  const now = new Date().toISOString()

  if (top.length > 0) {
    const freeSlots: number[] = []
    for (let p = 1; p <= 5 && freeSlots.length < top.length; p++) {
      if (!usedPriorities.has(p)) freeSlots.push(p)
    }

    const toUpsert = top.map((p, i) => ({
      product_id: productId,
      url: p.url,
      title: p.title,
      description: p.description,
      page_type: p.pageType,
      keywords: p.keywords,
      relevance_score: p.relevanceScore,
      matched_keywords: p.matchedKeywords,
      selection_reason: p.reason || null,
      // Falls back to 5 if keepTop ever exceeds the 1-5 range the DB check
      // constraint allows — shouldn't happen given DEFAULT_KEEP_TOP mirrors
      // the web app's MAX_TRACKED_PAGES cap of 5.
      priority: freeSlots[i] ?? 5,
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
