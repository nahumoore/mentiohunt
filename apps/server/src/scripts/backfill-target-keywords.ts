/**
 * One-off backfill: give every existing product a `target_keywords` set so
 * the new keyword-first pages pipeline (crawlProductPages) has something to
 * work with on its next run, without forcing everyone through onboarding
 * again.
 *
 * For products with crawled product_pages, this is free and a genuinely good
 * signal — union the LLM-extracted `keywords` column across those pages,
 * frequency-rank, take the top 5 (array order is priority: most-frequent
 * first). Only products with zero crawled pages fall back to one LLM call
 * from product_name + product_description.
 *
 * Never overwrites a product that already has target_keywords set (e.g. one
 * that completed the new onboarding).
 *
 * Usage:
 *   pnpm --filter server exec tsx src/scripts/backfill-target-keywords.ts --dry-run
 *   pnpm --filter server exec tsx src/scripts/backfill-target-keywords.ts
 */
import { supabaseAdmin } from "@workspace/supabase/admin"
import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../helpers/logger.js"
import { parseLlmJson } from "../helpers/parse-llm-json.js"

const log = createLogger("backfill-target-keywords")

const dryRun = process.argv.includes("--dry-run")

const MAX_KEYWORDS = 5

function normalizeKeyword(value: string): string {
  return value.trim().replace(/\s+/g, " ").toLowerCase()
}

function rankByFrequency(keywords: string[]): string[] {
  const counts = new Map<string, number>()
  for (const raw of keywords) {
    const k = normalizeKeyword(raw)
    if (!k) continue
    counts.set(k, (counts.get(k) ?? 0) + 1)
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k).slice(0, MAX_KEYWORDS)
}

async function generateKeywordsFromProduct(product: {
  product_name: string
  product_description: string
}): Promise<string[]> {
  const systemInstructions = [
    "Given a product's name and description, list the search keywords this site should be earning backlinks for.",
    'Return JSON only: {"keywords":["backlink outreach software"]}',
    "5 unique keywords, 1-5 words each, lowercase, no punctuation, no brand names, no questions, ranked most important first.",
  ].join("\n")

  try {
    const output = await generateText({
      input: `Product name: ${product.product_name}\nDescription: ${product.product_description}`,
      systemInstructions,
      model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
      fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
      timeoutMs: 30_000,
    })
    const parsed = parseLlmJson<{ keywords?: string[] }>(output.text)
    return rankByFrequency(parsed?.keywords ?? [])
  } catch (err) {
    log.warn("LLM keyword generation failed", { error: String(err) })
    return []
  }
}

async function main() {
  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description, target_keywords")

  if (error) throw new Error(`failed to load products: ${error.message}`)

  const candidates = (products ?? []).filter((p) => (p.target_keywords ?? []).length === 0)
  log.info(dryRun ? "dry-run start" : "backfill start", { totalProducts: products?.length ?? 0, candidates: candidates.length })

  let fromPages = 0
  let fromLlm = 0
  let skipped = 0

  for (const product of candidates) {
    const { data: pages, error: pagesError } = await supabaseAdmin
      .from("product_pages")
      .select("keywords")
      .eq("product_id", product.id)
      .eq("crawl_status", "crawled")

    if (pagesError) {
      log.warn("failed to load pages", { productId: product.id, error: pagesError.message })
      continue
    }

    const pageKeywords = (pages ?? []).flatMap((p) => p.keywords ?? [])
    let keywords = rankByFrequency(pageKeywords)

    if (keywords.length >= 5) {
      fromPages++
    } else if (product.product_name && product.product_description) {
      keywords = await generateKeywordsFromProduct(product)
      if (keywords.length > 0) fromLlm++
    }

    if (keywords.length === 0) {
      skipped++
      log.warn("no keywords derivable, skipping", { productId: product.id })
      continue
    }

    if (dryRun) {
      log.info("dry-run: would set target_keywords", { productId: product.id, keywords })
      continue
    }

    const { error: updateError } = await supabaseAdmin
      .from("products")
      .update({ target_keywords: keywords })
      .eq("id", product.id)

    if (updateError) {
      log.error("failed to update product", { productId: product.id, error: updateError.message })
    }
  }

  log.success(dryRun ? "dry-run done" : "backfill done", { fromPages, fromLlm, skipped })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error("backfill script failed", { error: String(err) })
    process.exit(1)
  })
