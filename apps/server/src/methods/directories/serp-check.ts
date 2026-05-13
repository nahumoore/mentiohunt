import { toSlug } from "./slug.js"

export type CheckResult = {
  status: "listed" | "gap" | "error";
  url: string;
  reason?: string;
};

type Directory = {
  domain: string;
  submit_url: string;
};

type SerpResult = {
  title?: string;
  url?: string;
  description?: string;
};

type ApifyItem = {
  results?: SerpResult[];
};

const NON_LISTING_SEGMENTS = ["competitors", "alternatives", "compare", "vs", "reviews"]

export const SERP_BATCH_SIZE = 7

function apifyUrl(token: string) {
  return `https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper/run-sync-get-dataset-items?token=${token}`
}

function isListingUrl(url: string, slug: string): boolean {
  const lower = url.toLowerCase()
  if (!lower.includes(slug)) return false
  return !NON_LISTING_SEGMENTS.some((seg) => lower.includes(`/${seg}`))
}

export async function serpCheck(directory: Directory, productName: string): Promise<CheckResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set");
  }

  const query = `site:${directory.domain} "${productName}"`;

  const response = await fetch(apifyUrl(token), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyword: query,
      limit: "10",
      country: "US",
      include_merged: false,
    }),
    signal: AbortSignal.timeout(90_000),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    return {
      status: "error",
      url: directory.submit_url,
      reason: `Apify HTTP ${response.status}: ${text.slice(0, 200)}`,
    };
  }

  const items: ApifyItem[] = await response.json();
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

  const token = process.env.APIFY_TOKEN
  if (!token) throw new Error("APIFY_TOKEN is not set")

  const domainQuery = directories.map((d) => `site:${d.domain}`).join(" OR ")
  const query = `"${productName}" ${domainQuery}`

  const response = await fetch(apifyUrl(token), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      keyword: query,
      limit: "20",
      country: "US",
      include_merged: false,
    }),
    signal: AbortSignal.timeout(90_000),
  })

  if (!response.ok) {
    const text = await response.text().catch(() => "")
    const reason = `Apify HTTP ${response.status}: ${text.slice(0, 200)}`
    for (const dir of directories) {
      resultMap.set(dir.domain, { status: "error", url: dir.submit_url, reason })
    }
    return resultMap
  }

  const items: ApifyItem[] = await response.json()
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
