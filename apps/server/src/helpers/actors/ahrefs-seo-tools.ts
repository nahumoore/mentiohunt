/**
 * Ahrefs All-in-One SEO Scraper
 * https://apify.com/pro100chok/ahrefs-seo-tools
 *
 * Valid searchType values (as of 2026-06-01):
 *   website_authority, backlinks_overview, backlinks_list, broken_links,
 *   traffic_overview, ai_visibility, website_details, keyword_ideas,
 *   keyword_difficulty, keyword_metrics, keyword_rank, serp_overview, top_websites
 *
 * For competitor backlinks use searchType="backlinks_list".
 *
 * TODO: confirm AhrefsBacklinkItem field names from a live run.
 */
export const AHREFS_SEO_TOOLS = "pro100chok~ahrefs-seo-tools"

export const AHREFS_TRAFFIC_SEARCH_TYPE = "traffic_overview"

export type AhrefsSeoToolsInput = {
  searchType: string
  urls: string[]
  includeDetails?: boolean
  [key: string]: unknown
}

// Field names unverified — extracted dynamically by scanning for keys matching /traffic/i.
export type AhrefsSeoToolsResult = Record<string, unknown>

export type AhrefsBacklinkItem = {
  urlFrom: string
  urlTo: string
  anchor: string
  domainRating: number
  title: string
  textPre: string
  textPost: string
}

// Actor returns one wrapper object per queried URL, backlinks nested inside.
export type AhrefsBacklinksResponse = {
  searchType: string
  domain: string
  backlinks: AhrefsBacklinkItem[]
}
