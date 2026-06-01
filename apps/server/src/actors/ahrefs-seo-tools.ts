/**
 * Ahrefs All-in-One SEO Scraper
 * https://apify.com/pro100chok/ahrefs-seo-tools
 *
 * 13 search types via Ahrefs free tools API (no Ahrefs subscription needed).
 * For competitor backlinks use searchType="backlinks" or "referring_domains".
 *
 * Input: AhrefsSeoToolsInput
 * Output per item (backlinks mode): { sourceUrl, sourceDomainRating, dofollow,
 *                                     traffic, language, targetUrl, ... }
 *
 * Pricing: from $5.00 / 1,000 results. Supports up to 10 parallel targets.
 *
 * TODO: confirm exact field names from a live run before wiring filters.ts.
 */
export const AHREFS_SEO_TOOLS = "pro100chok~ahrefs-seo-tools"

/**
 * Needs verification via a live test run — "traffic_checker" is a best-guess.
 * If the actor returns no traffic field, analyzeBacklinkSite degrades gracefully.
 */
export const AHREFS_TRAFFIC_SEARCH_TYPE = "traffic_checker"

export type AhrefsSeoToolsInput = {
  searchType: string
  target: string
  [key: string]: unknown
}

// Field names unverified — extracted dynamically by scanning for keys matching /traffic/i.
export type AhrefsSeoToolsResult = Record<string, unknown>

// Verified field names from live sample run (searchType="backlinks").
export type AhrefsBacklinkItem = {
  urlFrom: string
  urlTo: string
  anchor: string
  domainRating: number
  title: string
  textPre: string
  textPost: string
}
