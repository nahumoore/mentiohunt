/**
 * Ahrefs Website Authority Checker
 * https://apify.com/kinaesthetic_millionaire/ahref-website-authority-checker
 *
 * Input: { start_urls: [{ url: string }] }
 * Output per item: { url, normalized_url, domainRating, backlinks, refdomains,
 *                    dofollowBacklinks, dofollowRefdomains, error? }
 *
 * Free plan: 1 URL/run. Paid: unlimited, up to 5 concurrent.
 * Timeout: set to 300s in query param; allow 360s on fetch side.
 */
export const AHREFS_AUTHORITY_CHECKER =
  "kinaesthetic_millionaire~ahref-website-authority-checker"

/**
 * Ahrefs All-in-One SEO Scraper
 * https://apify.com/pro100chok/ahrefs-seo-tools
 *
 * 13 search types via Ahrefs free tools API (no Ahrefs subscription needed).
 * For competitor backlinks use searchType="backlinks" or "referring_domains".
 *
 * Input: { searchType: string, target: string, ... }
 * Output per item (backlinks mode): { sourceUrl, sourceDomainRating, dofollow,
 *                                     traffic, language, targetUrl, ... }
 *
 * Pricing: from $5.00 / 1,000 results. Supports up to 10 parallel targets.
 * Use for COMPETITOR_BACKLINKS_SCRAPER — normalize output to
 * { referring_domain, referring_page_url, dr, traffic, dofollow, language }.
 *
 * TODO: confirm exact field names from a live run before wiring filters.ts.
 */
export const AHREFS_SEO_TOOLS = "pro100chok~ahrefs-seo-tools"

/**
 * Contact enrichment actor — TBD
 * Placeholder for domain → { contact_email, contact_name } enrichment.
 */
export const CONTACT_ENRICHMENT = "" // fill before impl
