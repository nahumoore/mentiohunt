/**
 * Google Search Results SERP Scraper by scraperlink
 * https://apify.com/scraperlink/google-search-results-serp-scraper
 *
 * Input: GoogleSerpInput
 * Output per item: GoogleSerpItem containing a results array
 */
export const SCRAPERLINK_GOOGLE_SERP = "scraperlink~google-search-results-serp-scraper"

export type GoogleSerpInput = {
  keyword: string
  limit: string
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
