/**
 * Ahrefs Website Authority Checker
 * https://apify.com/kinaesthetic_millionaire/ahref-website-authority-checker
 *
 * Input: { start_urls: [{ url: string }] }
 * Output per item: AhrefsAuthorityResult
 *
 * Free plan: 1 URL/run. Paid: unlimited, up to 5 concurrent.
 * Timeout: set to 300s in query param; allow 360s on fetch side.
 */
export const AHREFS_AUTHORITY_CHECKER =
  "kinaesthetic_millionaire~ahref-website-authority-checker"

export type AhrefsAuthorityInput = {
  start_urls: { url: string }[]
}

export type AhrefsAuthorityResult = {
  url?: string
  normalized_url?: string
  domainRating?: number | string | null
  backlinks?: number | string | null
  refdomains?: number | string | null
  dofollowBacklinks?: number | string | null
  dofollowRefdomains?: number | string | null
  error?: string
}
