# Strategy: Broken link building (`broken_link_building`)

**Status: Proposal — not actioned**
**Effort: M** · **Suggested build order: 4th (after the shared extraction)**

## What it finds

Pages that link to a **dead URL** (404/410/gone) in the customer's topic space, where one of the
customer's own crawled pages is a credible replacement. Classic broken link building, but sourced from
data we already pay for rather than from a crawl.

## Why it converts

The email contains a verifiable favour: "your page links to X, and X is gone — here's a 404 you'll want
to fix." That's useful information regardless of whether they take the replacement, which is exactly
why it gets replies. The replacement suggestion rides along as a low-pressure second sentence.

It's also the strategy with the strongest *fit rationale* to show in the queue: we can state the exact
dead URL, its HTTP status, and which of the customer's pages matches its topic. That's the kind of
concrete, non-metric rationale CLAUDE.md asks the product to surface.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Competitor backlink profiles | `helpers/data-for-seo/get-backlinks.ts` | exists, already paid for by `competitor_backlink` |
| HTTP status checking + soft-404 detection | `helpers/http.ts` (`fetchWithRetry`, `HttpStatusError`), `methods/directories/head-check.ts` | exists — soft-404 title heuristics already written |
| Crawled replacement pages | `product_pages` (`page_type`, `keywords`, `priority`) | exists |
| Page fetch, scoring, enrichment | standard | exists |

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => {
  if ((product.competitors ?? []).length === 0) return false
  const { count } = await supabaseAdmin
    .from("product_pages")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("crawl_status", "crawled")
    .in("page_type", ["article", "resource", "free_tool"])
  return (count ?? 0) > 0
}
```

Needs **both** competitors (to source the link graph) and crawled pages (to have something to offer).
Landing pages are excluded deliberately — nobody replaces a dead reference with a pricing page.

## Where the dead links come from

Three candidate sources, in order of cost:

1. **Competitor backlink profiles (recommended for v1).** `getBacklinks({ target: competitorDomain })`
   returns `url_from` → `url_to` pairs. We already fetch these for `competitor_backlink` and page
   through them with a cursor. Any `url_to` that now 404s is a dead target, and every `url_from`
   pointing at it is a prospect. Cheap because the fetch is already in the billing plan, and it stays
   inside the customer's competitive neighbourhood, so topical fit is likely by construction.
2. **The customer's own lost-link graph.** Overlaps ticket 02 — skip here.
3. **Fresh crawling of niche resource pages.** Most expensive, most coverage. Out of scope for v1.

Worth noting for source 1: `getBacklinks` uses `mode: "one_per_domain"`, so a given run sees one
linking page per referring domain. That's fine for prospecting but means dead-target *discovery* is
sparse — one dead `url_to` may have many linking pages we never see. If the strategy proves out,
consider a second call without `one_per_domain` scoped to already-confirmed dead targets.

## Pipeline

1. **Select competitors for the run** — reuse `selectCompetitorsForRun` from
   `competitor-backlink/prospect-run-tracking.ts` (least-recently-run rotation).
2. **Fetch backlinks** per selected competitor via `extractBacklinks`, persisting the cursor in
   `backlink_prospect_runs.metadata` exactly as `process-competitor.ts` does. **Use a cursor
   independent of `competitor_backlink`'s** — same competitor, different strategy, different pagination
   state; key it by `(strategy, competitorDomain)`.
3. **Collect distinct `url_to` values** across the batch. This is the dead-target candidate set, and
   it's much smaller than the backlink set (many links share targets), which is what makes the check
   affordable.
4. **Status-check each target** — `fetchWithRetry(url, { maxAttempts: 2, timeoutMs: 10_000, rangeBytes: 8192 })`.
   Classify:
   - `HttpStatusError` 404/410 → **dead**;
   - 2xx but the body's `<title>` matches the soft-404 patterns in `head-check.ts:10-19` → **dead**
     (reuse those patterns rather than rewriting them);
   - redirect to a URL that lost the original path → **dead-ish**, treat as dead but flag it;
   - anything else → alive, discard.
   Cache results across products in a shared table if this gets expensive — competitors overlap
   heavily between customers in the same category.
5. **Group linking pages by dead target**, then drop `url_from` values whose domain is our own, a
   noise domain, or already stored for this product.
6. **Match a replacement page** — for each dead target, pick the best `product_pages` row. Signal
   available without an LLM call: the dead URL's slug and the linking page's anchor text
   (`DataForSeoBacklinkItem.anchor`, plus `text_pre`/`text_post` context) vs `product_pages.keywords`.
   Recommend an LLM pass anyway (batched, one call for many pairs) because slug-matching alone will
   confidently propose a mismatched page, and a bad replacement suggestion in the email is worse than
   none. Return `null` when nothing fits — then either drop the prospect or pitch it as a pure
   heads-up (see open questions).
7. **Fetch + qualify the linking page** — `fetchPageContent(url_from)`, confirm the dead link is
   actually present in the live HTML (DataForSEO's index lags; the link may already be fixed or the
   page rewritten) and that the page is a place where a replacement reference is plausible
   (resource list, guide, article — not a comment thread or an archive index).
8. **DR filter** → **site relevance** → **persist + enrich**. `tier: "broken_link_building"`,
   `found_url` = `url_from`, `target_url` = the chosen replacement page's URL,
   `product_page_id` = that page's id (the column exists and `resource_page_inclusion` already uses
   it). `raw_metadata` carries the dead URL, its status code, the anchor text, and the match rationale.
9. **Alert** — `helpers/emails/send-broken-link-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "broken_link_building"
    title: string
    foundUrl: string
    deadUrl: string
    deadUrlStatus: number | "soft_404"
    anchorText: string | null
    targetUrl: string          // our replacement page
    targetTitle: string
    matchReason: string
  }
```

`buildFraming`: lead with the broken link — exact URL, and the anchor text so they can find it on the
page. Then one sentence offering the replacement, framed as optional. The failure mode to prompt
against is the template every SEO agency sends ("I was browsing your excellent resource page and
noticed..."), which recipients recognise instantly. Instruct: state the dead URL in the first sentence,
no flattery preamble, no "I was browsing".

Email 2 shouldn't re-pitch — it should note that the link is still broken (which is checkable and
true) and leave the replacement offer standing. Email 3: drop the ask, just leave the information.

## Cost per run

Highest infrastructure cost of the SERP-free strategies, because of step 4. Per run: 1–3 DataForSEO
backlink calls (already budgeted), ~50–150 HEAD-ish range requests for status checks, ~20 full page
fetches, 1–2 LLM batches for replacement matching plus the usual scoring, then enrichment. The status
checks go through `fetchWithRetry` (plain HTTP, not the scraper service), so they don't consume
scraper-pool slots — worth keeping it that way.

## Rotation / exhaustion notes

Regenerates naturally: the competitor cursor advances each run, and the web keeps breaking. Unlike SERP
strategies there's no fixed query pool to mine out. Expect low yield-per-run but high quality — a
handful of prospects per run is a good outcome here.

## Open questions

- **No replacement page found → still worth an email?** A pure "your link is broken" heads-up builds
  goodwill and sometimes gets a "thanks, what do you do?" reply, but it doesn't advance a placement and
  it burns a send from the pool. Lean toward dropping in v1 and revisiting once reply data exists.
- **Shared dead-URL cache across products.** Competitors overlap across customers; checking the same
  dead URL for every customer independently is waste. A `dead_url_checks` table with a TTL would cut
  step 4 substantially — but it's premature until the strategy proves out.
- **Soft-404 detection is heuristic.** `head-check.ts`'s title patterns were tuned for directory
  listing pages, not general web pages. Expect false positives on pages whose titles happen to contain
  "not found". Verify against real data before trusting it, and consider requiring a hard 404/410 in
  v1 for a cleaner signal.
- **This is the one strategy where being wrong is publicly embarrassing** — telling a founder their
  link is broken when it isn't. Both the status check and the step-7 live-HTML confirmation should be
  required, not optional.
