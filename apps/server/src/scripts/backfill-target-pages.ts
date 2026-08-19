/**
 * One-off backfill: narrow existing products' `product_pages` down to the
 * top 5 keyword-matched targets, now that `target_keywords` has been set
 * (run backfill-target-keywords.ts first).
 *
 * Does NOT re-crawl — scores the metadata (title/description/keywords)
 * already stored on each crawled row against the product's target keywords,
 * via the same categorizePages LLM call the live pipeline uses. Rows are
 * only ever updated (is_target true/false + relevance fields), never
 * deleted, so every existing backlink_prospects.product_page_id link
 * survives. Manually added pages (is_manual) are left untouched — always
 * is_target.
 *
 * Skips products with <= 5 crawled pages (nothing to narrow) or without
 * target_keywords set.
 *
 * Usage:
 *   pnpm --filter server exec tsx src/scripts/backfill-target-pages.ts --dry-run
 *   pnpm --filter server exec tsx src/scripts/backfill-target-pages.ts
 */
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import { categorizePages } from "../methods/product-pages/categorize-pages.js"

const log = createLogger("backfill-target-pages")

const dryRun = process.argv.includes("--dry-run")
const KEEP_TOP = 5

function scoreToPriority(score: number): number {
  const bucket = score >= 80 ? 5 : score >= 60 ? 4 : score >= 40 ? 3 : score >= 20 ? 2 : 1
  return Math.max(bucket, 3)
}

async function main() {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description, target_keywords")

  if (error) throw new Error(`failed to load products: ${error.message}`)

  const candidates = (products ?? []).filter((p) => (p.target_keywords ?? []).length > 0)
  log.info(dryRun ? "dry-run start" : "backfill start", { candidates: candidates.length })

  let narrowed = 0
  let skipped = 0

  for (const product of candidates) {
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from("product_pages")
      .select("id, url, title, description")
      .eq("product_id", product.id)
      .eq("crawl_status", "crawled")
      .eq("is_manual", false)

    if (pagesError) {
      log.warn("failed to load pages", { productId: product.id, error: pagesError.message })
      continue
    }

    if (!pages || pages.length <= KEEP_TOP) {
      skipped++
      continue
    }

    const { results } = await categorizePages(
      pages.map((p) => ({ url: p.url, title: p.title ?? "", description: p.description ?? "", text: "" })),
      { product_name: product.product_name, product_description: product.product_description },
      product.target_keywords
    )

    if (results.length === 0) {
      log.warn("categorization returned nothing, skipping", { productId: product.id })
      continue
    }

    const byUrl = new Map(pages.map((p) => [p.url, p.id]))
    const sorted = [...results].sort((a, b) => b.relevanceScore - a.relevanceScore)
    const top = sorted.slice(0, KEEP_TOP)
    const topIds = new Set(top.map((r) => byUrl.get(r.url)).filter((id): id is string => Boolean(id)))

    log.info(dryRun ? "dry-run: would narrow to" : "narrowing to", {
      productId: product.id,
      top: top.map((t) => ({ url: t.url, relevanceScore: t.relevanceScore })),
    })

    if (dryRun) {
      narrowed++
      continue
    }

    for (const r of top) {
      const id = byUrl.get(r.url)
      if (!id) continue
      const { error: updateError } = await supabaseAdmin
        .from("product_pages")
        .update({
          is_target: true,
          relevance_score: r.relevanceScore,
          matched_keywords: r.matchedKeywords,
          selection_reason: r.reason || null,
          priority: scoreToPriority(r.relevanceScore),
        })
        .eq("id", id)
      if (updateError) log.warn("failed to update selected page", { id, error: updateError.message })
    }

    const otherIds = pages.map((p) => p.id).filter((id) => !topIds.has(id))
    if (otherIds.length > 0) {
      const { error: retireError } = await supabaseAdmin
        .from("product_pages")
        .update({ is_target: false })
        .in("id", otherIds)
      if (retireError) log.warn("failed to retire pages", { productId: product.id, error: retireError.message })
    }

    narrowed++
  }

  log.success(dryRun ? "dry-run done" : "backfill done", { narrowed, skipped })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error("backfill script failed", { error: String(err) })
    process.exit(1)
  })
