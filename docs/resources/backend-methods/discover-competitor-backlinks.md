# `discoverCompetitorBacklinks`

Source: `apps/server/src/methods/competitor-backlinks/discover-competitor-backlinks.ts`

## What this method does

`discoverCompetitorBacklinks` finds backlink prospects by looking at sites that already link to a product's competitors. It filters and scores those backlink sources, stores the best prospects in `backlink_prospects`, and then starts background enrichment to find contact info and generate an outreach email.

## Step-by-step flow

1. It logs the start of the discovery run and loads the sender name from the `profiles` table using `product.user_id`.
2. It exits early if the product has no competitors configured.
3. It shuffles the product's competitor list and keeps only the first 5 competitors for the current run.
4. It extracts the domain for each selected competitor URL and calls `extractBacklinks` for each one.
5. It limits competitor extraction concurrency to 3 at a time with `p-limit`.
6. It tags every extracted backlink with the competitor domain it came from, then flattens all selected competitor results into one list.
7. It runs `filterBacklinks(allItems, settings)` to remove backlinks that do not match the current filter settings.
8. It exits early if nothing survives the pre-filter step.
9. It converts each remaining backlink source URL into a domain and checks `backlink_prospects` for existing rows for the same `product_id`, `tier = competitor_backlink`, and domain.
10. It removes any domains that already exist in the database so the method only works on fresh prospects.
11. It exits early if every filtered result was already known.
12. It sends the fresh backlink candidates to `scoreBacklinkRelevance` to evaluate how relevant each source is for the product.
13. It keeps only results with `relevanceScore >= 3`, sorts them from highest score to lowest score, and caps the run to the top 20 prospects.
14. It exits early if no candidates pass scoring, but still returns the scoring cost.
15. It maps each passing result into a minimal `backlink_prospects` row containing product id, source domain, source URL, target URL, tier, action type, and status.
16. It upserts those rows into `backlink_prospects` with `ignoreDuplicates: true`.
17. It exits early if the upsert fails or if no rows were inserted/returned.
18. It builds a lookup map from `found_url` to the scored backlink item so each inserted row can be matched back to its full scoring context.
19. It starts background enrichment with concurrency limited to 1 at a time.
20. For each inserted row, it runs `runBackgroundEnrichment` without blocking the main method response.
21. It logs completion and returns the number of created prospects plus the total scoring cost.

## What background enrichment does

1. It calls `enrichContact(item.urlFrom, item.pageType, domain)` to find a contact for the backlink source.
2. If no email is found, it deletes the just-created `backlink_prospects` row so low-value prospects do not remain in the queue.
3. It derives the target page path from `item.urlTo`.
4. It calls `generateBacklinkEmail` using the product, backlink context, contact name, competitor domain, and sender name.
5. It updates the stored prospect row with contact name, contact email, social links, and the generated email draft.
6. It logs success or logs a warning if enrichment or the database update fails.

## Important behavior notes

- The method returns before enrichment finishes. Contact discovery and email drafting happen asynchronously in the background.
- Competitor extraction is capped by `MAX_COMPETITORS_PER_RUN`, currently set to `5`.
- The competitor list is shuffled before slicing, so different competitors can be processed across runs instead of always taking the same first entries.
- The main relevance threshold is controlled by `MIN_RELEVANCE_SCORE`, currently set to `3`.
- After scoring, the method only keeps the highest-scoring 20 prospects for the run.
- Database deduplication happens by source domain, not by exact URL.
- Prospects without a discovered email are intentionally removed after insertion.
- Background enrichment now runs sequentially, one inserted prospect at a time.
- `totalCostUsd` comes from the relevance scoring step, not from extraction or enrichment.
