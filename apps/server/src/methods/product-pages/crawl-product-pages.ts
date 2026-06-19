import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { fetchSitemapUrls, filterContentUrls } from "../../helpers/sitemap.js"
import { createLogger } from "../../helpers/logger.js"
import { categorizePages, type PageToClassify } from "./categorize-pages.js"

const log = createLogger("crawl-product-pages")

type ScraperContentResult = {
  url: string
  title: string
  description: string
  text: string
}

async function fetchContentFromScraper(url: string): Promise<ScraperContentResult | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) return null
  try {
    const scraperApiKey = process.env.SCRAPER_API_KEY
    const res = await fetch(`${scraperUrl}/fetch-content`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
      },
      body: JSON.stringify({ url }),
    })
    if (!res.ok) {
      log.warn("scraper fetch-content failed", { url, status: res.status })
      return null
    }
    return (await res.json()) as ScraperContentResult
  } catch (err) {
    log.warn("scraper fetch-content error", { url, error: String(err) })
    return null
  }
}

const CRAWL_CONCURRENCY = 10

export type CrawlProductPagesResult = {
  pagesFound: number
  pagesCrawled: number
  pagesFailed: number
  totalCostUsd: number
}

export async function crawlProductPages(
  productId: string,
  pageLimit: number
): Promise<CrawlProductPagesResult> {
  log.info("START", { productId, pageLimit })

  // Load product + existing product_pages
  const [{ data: product, error: productError }, { data: pages, error: pagesError }] =
    await Promise.all([
      supabaseAdmin
        .from("products")
        .select("id, product_name, product_description, website_url")
        .eq("id", productId)
        .single(),
      supabaseAdmin
        .from("product_pages")
        .select("id, url, page_type")
        .eq("product_id", productId),
    ])

  if (productError || !product) {
    throw new Error(`Could not load product ${productId}: ${productError?.message}`)
  }
  if (pagesError) {
    throw new Error(`Could not load product_pages for ${productId}: ${pagesError.message}`)
  }

  const allPages = pages ?? []
  const sitemapRows = allPages.filter((p) => p.page_type === "sitemap")
  const manualRows = allPages.filter((p) => p.page_type === "manual")

  let urlsToProcess: string[]

  if (sitemapRows.length > 0) {
    // Sitemap mode — expand each sitemap row, filter, then cap
    log.info("sitemap mode", { sitemapCount: sitemapRows.length })

    const rawUrls: string[] = []
    for (const row of sitemapRows) {
      try {
        const fetched = await fetchSitemapUrls(row.url)
        rawUrls.push(...fetched)
      } catch (err) {
        log.warn("sitemap fetch failed, skipping", { url: row.url, error: String(err) })
      }
    }

    const filtered = filterContentUrls(rawUrls)
    urlsToProcess = filtered.slice(0, pageLimit)

    log.info("sitemap expanded", {
      raw: rawUrls.length,
      afterFilter: filtered.length,
      capped: urlsToProcess.length,
    })

    // Delete the sitemap placeholder rows — real pages will be inserted below
    const sitemapIds = sitemapRows.map((r) => r.id)
    const { error: deleteError } = await supabaseAdmin
      .from("product_pages")
      .delete()
      .in("id", sitemapIds)

    if (deleteError) {
      log.warn("failed to delete sitemap placeholder rows", { error: deleteError.message })
    }
  } else {
    // Manual mode — use existing manual rows (capped)
    log.info("manual mode", { pageCount: manualRows.length })
    urlsToProcess = manualRows.map((r) => r.url).slice(0, pageLimit)
  }

  if (urlsToProcess.length === 0) {
    log.info("no URLs to process, skipping")
    return { pagesFound: 0, pagesCrawled: 0, pagesFailed: 0, totalCostUsd: 0 }
  }

  // Crawl pages concurrently
  type CrawledPage = PageToClassify & { crawlFailed: boolean }

  const limit = pLimit(CRAWL_CONCURRENCY)
  const crawled: CrawledPage[] = await Promise.all(
    urlsToProcess.map((url) =>
      limit(async () => {
        try {
          const scraped = await fetchContentFromScraper(url)
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

  // LLM categorize + keyword extraction for successfully crawled pages
  const { results: categorized, totalCost } = await categorizePages(succeeded, {
    product_name: product.product_name,
    product_description: product.product_description,
  })

  const catByUrl = new Map(categorized.map((c) => [c.url, c]))

  const now = new Date().toISOString()

  if (sitemapRows.length > 0) {
    // Insert new rows for sitemap-discovered URLs
    const toInsert = crawled.map((p) => {
      const cat = catByUrl.get(p.url)
      return {
        product_id: productId,
        url: p.url,
        page_type: (cat?.pageType ?? "article") as string,
        priority: (cat?.priority ?? "medium") as string,
        keywords: cat?.keywords ?? [],
        title: p.title || null,
        description: p.description || null,
        crawl_status: p.crawlFailed ? "failed" : "crawled",
        crawled_at: p.crawlFailed ? null : now,
      }
    })

    const { error: insertError } = await supabaseAdmin
      .from("product_pages")
      .insert(toInsert)

    if (insertError) {
      log.error("failed to insert crawled pages", { error: insertError.message })
    }
  } else {
    // Update existing manual rows
    const manualByUrl = new Map(manualRows.map((r) => [r.url, r.id]))

    await Promise.all(
      crawled.map(async (p) => {
        const rowId = manualByUrl.get(p.url)
        if (!rowId) return

        const cat = catByUrl.get(p.url)
        const { error } = await supabaseAdmin
          .from("product_pages")
          .update({
            page_type: (cat?.pageType ?? "article") as string,
            priority: (cat?.priority ?? "medium") as string,
            keywords: cat?.keywords ?? [],
            title: p.title || null,
            description: p.description || null,
            crawl_status: p.crawlFailed ? "failed" : "crawled",
            crawled_at: p.crawlFailed ? null : now,
          })
          .eq("id", rowId)

        if (error) {
          log.warn("failed to update product_page row", { url: p.url, error: error.message })
        }
      })
    )
  }

  log.info("done", {
    productId,
    pagesCrawled: succeeded.length,
    pagesFailed: failed.length,
    cost_usd: totalCost.toFixed(4),
  })

  return {
    pagesFound: urlsToProcess.length,
    pagesCrawled: succeeded.length,
    pagesFailed: failed.length,
    totalCostUsd: totalCost,
  }
}
