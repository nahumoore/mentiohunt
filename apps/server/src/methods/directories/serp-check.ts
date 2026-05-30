import { toSlug } from "./slug.js"
import { runApifyActor } from "../../actors/run-apify-actor.js"
import { SCRAPERLINK_GOOGLE_SERP, type GoogleSerpInput, type GoogleSerpItem } from "../../actors/google-serp-scraper.js"

export type CheckResult = {
  status: "listed" | "gap" | "error";
  url: string;
  reason?: string;
};

type Directory = {
  domain: string;
  submit_url: string;
};

const NON_LISTING_SEGMENTS = ["competitors", "alternatives", "compare", "vs", "reviews"]

export const SERP_BATCH_SIZE = 7

function isListingUrl(url: string, slug: string): boolean {
  const lower = url.toLowerCase()
  if (!lower.includes(slug)) return false
  return !NON_LISTING_SEGMENTS.some((seg) => lower.includes(`/${seg}`))
}

export async function serpCheck(directory: Directory, productName: string): Promise<CheckResult> {
  const query = `site:${directory.domain} "${productName}"`;

  let items: GoogleSerpItem[]
  try {
    items = await runApifyActor<GoogleSerpItem[]>(SCRAPERLINK_GOOGLE_SERP, {
      keyword: query,
      limit: "10",
      country: "US",
      include_merged: false,
    } satisfies GoogleSerpInput, 90)
  } catch (err) {
    return {
      status: "error",
      url: directory.submit_url,
      reason: err instanceof Error ? err.message : String(err),
    }
  }

  const results = items.flatMap((item) => item.results ?? [])

  if (results.length === 0) {
    return { status: "gap", url: directory.submit_url }
  }

  const slug = toSlug(productName)
  const listingResult = results.find((r) => r.url && isListingUrl(r.url, slug))

  if (listingResult?.url) {
    return { status: "listed", url: listingResult.url }
  }

  return { status: "gap", url: directory.submit_url }
}

/**
 * Checks multiple directories in a single SERP query using site:A OR site:B syntax.
 * Returns a map of domain → CheckResult. Cuts Apify calls from N to ceil(N / SERP_BATCH_SIZE).
 */
export async function serpBatchCheck(
  directories: Directory[],
  productName: string
): Promise<Map<string, CheckResult>> {
  const resultMap = new Map<string, CheckResult>()
  if (directories.length === 0) return resultMap

  const domainQuery = directories.map((d) => `site:${d.domain}`).join(" OR ")
  const query = `"${productName}" ${domainQuery}`

  let items: GoogleSerpItem[]
  try {
    items = await runApifyActor<GoogleSerpItem[]>(SCRAPERLINK_GOOGLE_SERP, {
      keyword: query,
      limit: "20",
      country: "US",
      include_merged: false,
    } satisfies GoogleSerpInput, 90)
  } catch (err) {
    const reason = err instanceof Error ? err.message : String(err)
    for (const dir of directories) {
      resultMap.set(dir.domain, { status: "error", url: dir.submit_url, reason })
    }
    return resultMap
  }

  const results = items.flatMap((item) => item.results ?? [])
  const slug = toSlug(productName)

  const listedByDomain = new Map<string, string>()
  for (const result of results) {
    if (!result.url) continue
    try {
      const hostname = new URL(result.url).hostname.replace(/^www\./, "")
      if (isListingUrl(result.url, slug) && !listedByDomain.has(hostname)) {
        listedByDomain.set(hostname, result.url)
      }
    } catch {
      // malformed URL — skip
    }
  }

  for (const dir of directories) {
    const hostname = dir.domain.replace(/^www\./, "")
    const listingUrl = listedByDomain.get(hostname)
    resultMap.set(
      dir.domain,
      listingUrl
        ? { status: "listed", url: listingUrl }
        : { status: "gap", url: dir.submit_url }
    )
  }

  return resultMap
}
