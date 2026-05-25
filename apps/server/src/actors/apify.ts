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
 * Tweet Scraper by apidojo
 * https://apify.com/apidojo/tweet-scraper
 *
 * Input: { searchTerms: string[], maxItems: number, sort: "Latest" | "Top",
 *          tweetLanguage?: string }
 * NOTE: do NOT pass start/end date params — same-day ranges return noResults.
 *       Use sort:"Latest" + maxItems to control recency instead.
 * Output per item (verified 2026-05-25):
 *   id, text, fullText, url, twitterUrl, createdAt (Twitter date format),
 *   author: { userName, name, id, profilePicture },
 *   likeCount, replyCount, retweetCount, viewCount, bookmarkCount,
 *   isReply, isRetweet, isQuote, lang, entities, media
 *
 * Pricing: $0.0004 / tweet (PAY_PER_EVENT, as of 2026-02-16).
 * At 200 tweets/run × 2 runs/day = ~$0.16/day.
 */
export const APIDOJO_TWEET_SCRAPER = "apidojo~tweet-scraper"

/**
 * Contact enrichment actor — TBD
 * Placeholder for domain → { contact_email, contact_name } enrichment.
 */
export const CONTACT_ENRICHMENT = "" // fill before impl

/**
 * AHREFS_SEO_TOOLS traffic searchType.
 * Needs verification via a live test run — "traffic_checker" is a best-guess.
 * If the actor returns no traffic field, analyzeBacklinkSite degrades gracefully.
 */
export const AHREFS_TRAFFIC_SEARCH_TYPE = "traffic_checker"

export async function runApifyActor<T>(
  actorId: string,
  input: unknown,
  timeoutSec = 300
): Promise<T> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSec + 60) * 1000),
  })
  if (!res.ok) throw new Error(`Apify ${res.status}: ${res.statusText}`)
  return res.json() as Promise<T>
}
