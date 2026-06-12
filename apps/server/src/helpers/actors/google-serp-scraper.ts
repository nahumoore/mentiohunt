/**
 * Google Search Results SERP Scraper by scraperlink
 * https://apify.com/scraperlink/google-search-results-serp-scraper
 *
 * Input: GoogleSerpInput
 *   - keyword: the search query string (supports Google operators: site:, after:, "phrase", OR, etc.)
 *   - limit: result count — MUST be one of "10"|"20"|"30"|"40"|"50"|"100"|"all" (other values → 400)
 *   - country: two-letter country code, e.g. "US"
 *   - include_merged: whether to include merged/related results
 *
 * Output: GoogleSerpItem[] — each item has a `results` array of GoogleSerpResult
 *   - results[].title: page title
 *   - results[].url: canonical URL of the result
 *   - results[].description: snippet text
 *
 * Common query patterns:
 *   - Index check:    site:domain.com/path/to/page   (no protocol — site: ignores https://)
 *   - Directory check: site:directory.com "Product Name"
 *   - Batch check:    "Product" (site:a.com OR site:b.com OR site:c.com)
 *   - Date filter:    keyword after:2024-01-01
 *
 * Timeout: actor runs synchronously; pass timeoutSec=60 for single-URL checks,
 *          timeoutSec=90 for batch queries.
 */
export const SCRAPERLINK_GOOGLE_SERP = "scraperlink~google-search-results-serp-scraper"

export type GoogleSerpInput = {
  keyword: string
  limit: "10" | "20" | "30" | "40" | "50" | "100" | "all"
  country: string
  include_merged: boolean
}

export type GoogleSerpResult = {
  title?: string
  url?: string
  description?: string
}

export type GoogleSerpItem = {
  results?: GoogleSerpResult[]
}
