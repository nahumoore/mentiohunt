import { CheckResult } from "./head-check.js";

type Directory = {
  domain: string;
  submit_url: string;
};

type ApifyItem = {
  organicResults?: unknown[];
};

export async function serpCheck(directory: Directory, productName: string): Promise<CheckResult> {
  const token = process.env.APIFY_TOKEN;
  if (!token) {
    throw new Error("APIFY_TOKEN is not set");
  }

  const query = `site:${directory.domain} "${productName}"`;
  const url = `https://api.apify.com/v2/acts/apify~google-search-scraper/run-sync-get-dataset-items?token=${token}`;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      queries: query,
      maxPagesPerQuery: 1,
      resultsPerPage: 10,
      countryCode: "us",
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
  const hasResults = items.some((item) => (item.organicResults?.length ?? 0) > 0);

  return { status: hasResults ? "listed" : "gap", url: directory.submit_url };
}
