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

export async function serpCheck(directory: Directory, productName: string): Promise<CheckResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set");
  }

  const query = `site:${directory.domain} "${productName}"`;
  const url = `https://api.apify.com/v2/acts/scraperlink~google-search-results-serp-scraper/run-sync-get-dataset-items?token=${token}`;

  const response = await fetch(url, {
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
  const NON_LISTING_SEGMENTS = ["competitors", "alternatives", "compare", "vs", "reviews"]
  const listingResult = results.find((r) => {
    const url = r.url?.toLowerCase()
    if (!url?.includes(slug)) return false
    return !NON_LISTING_SEGMENTS.some((seg) => url.includes(`/${seg}`))
  })

  if (listingResult?.url) {
    return { status: "listed", url: listingResult.url }
  }

  return { status: "gap", url: directory.submit_url }
}
