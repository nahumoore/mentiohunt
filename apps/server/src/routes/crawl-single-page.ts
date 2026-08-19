import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { fetchPageContent } from "../helpers/scraper-content-client.js"
import { categorizePages } from "../methods/product-pages/categorize-pages.js"

const log = createLogger("route-crawl-single-page")

export const crawlSinglePageRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

crawlSinglePageRouter.post("/pages/crawl", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown>
  const productId = typeof body?.productId === "string" ? body.productId.trim() : ""
  const pageId = typeof body?.pageId === "string" ? body.pageId.trim() : ""

  if (!productId || !pageId) {
    res.status(400).json({ error: "productId and pageId are required" })
    return
  }

  res.status(202).json({ queued: true })

  withRouteLog(`crawl-page-${pageId}`, () => runPageCrawl(productId, pageId)).catch(
    (err) => log.error("unhandled crawl error", { error: String(err) })
  )
})

async function runPageCrawl(productId: string, pageId: string) {
  log.info("START", { productId, pageId })

  const [{ data: page, error: pageError }, { data: product, error: productError }] =
    await Promise.all([
      supabaseAdmin
        .from("product_pages")
        .select("id, url")
        .eq("id", pageId)
        .eq("product_id", productId)
        .single(),
      supabaseAdmin
        .from("products")
        .select("product_name, product_description, target_keywords")
        .eq("id", productId)
        .single(),
    ])

  if (pageError || !page) {
    log.error("page not found", { pageId, error: pageError?.message })
    return
  }
  if (productError || !product) {
    log.error("product not found", { productId, error: productError?.message })
    return
  }

  const scraped = await fetchPageContent(page.url)

  if (!scraped) {
    log.warn("crawl failed, marking as failed", { url: page.url })
    await supabaseAdmin
      .from("product_pages")
      .update({ crawl_status: "failed" })
      .eq("id", pageId)
    return
  }

  // Extract keywords via LLM — keep user's page_type and priority unchanged,
  // but score against the product's target keywords so manually added pages
  // are comparable to auto-selected ones.
  const { results: categorized } = await categorizePages(
    [{ url: page.url, ...scraped }],
    { product_name: product.product_name, product_description: product.product_description },
    product.target_keywords ?? []
  )

  const cat = categorized[0]

  const { error: updateError } = await supabaseAdmin
    .from("product_pages")
    .update({
      title: scraped.title || null,
      description: scraped.description || null,
      keywords: cat?.keywords ?? [],
      relevance_score: cat?.relevanceScore ?? null,
      matched_keywords: cat?.matchedKeywords ?? [],
      selection_reason: cat?.reason || null,
      crawl_status: "crawled",
      crawled_at: new Date().toISOString(),
    })
    .eq("id", pageId)

  if (updateError) {
    log.error("failed to update page after crawl", { pageId, error: updateError.message })
    return
  }

  log.success("done", { pageId, url: page.url, keywords: cat?.keywords?.length ?? 0 })
}
