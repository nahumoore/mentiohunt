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
