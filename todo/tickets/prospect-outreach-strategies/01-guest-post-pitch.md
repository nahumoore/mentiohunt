# Strategy: Guest post pitch (`guest_post_pitch`)

**Status: Proposal — not actioned**
**Effort: S** (discovery half already written) · **Suggested build order: 1st**

## What it finds

Sites in the product's topical niche that publicly invite outside contributions — "write for us",
"become a contributor", "guest post guidelines" pages — where the product's founder could place an
article containing a contextual link.

## Why it's worth doing first

The discovery method **already exists and works**: `methods/guest-post-sites/find-guest-post-sites-by-url.ts`
does niche derivation → 6 Google footprints → SERP → dedupe → site relevance scoring, and is live
today behind the public free tool (`routes/free-tool-guest-post-sites.ts`). Turning it into a
rotation strategy is mostly plumbing.

It also fills a real gap in the strategy mix. All four current strategies ask a site owner to **edit
an existing page** (add us to your list, link your mention, add our resource). This one offers to
*write something for them* — a different ask, a different objection profile, and the only one where
the customer controls the anchor text and the surrounding context. For founder-led B2B SaaS the
by-the-founder byline is also an asset the ICP actually has.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Niche derivation (LLM) | `methods/guest-post-sites/derive-niches.ts` | exists |
| 6 footprint templates | `methods/guest-post-sites/types.ts` (`GUEST_POST_QUERY_TEMPLATES`) | exists |
| SERP scraper | `helpers/actors/google-serp-scraper.ts` | exists |
| Site relevance scoring | `shared/score-site-relevance.ts` | exists |
| Contact enrichment | `competitor-backlink/enrich-contact.ts` | exists |
| Page fetch | `listicle-roundup/check-listicle-client.ts` | exists |

## Precondition (`isRunnable`)

```ts
isRunnable: (product) => (product.product_name?.trim() ?? "") !== ""
```

Same bar as `listicle_roundup`. Optionally require at least one crawled `product_pages` row of
`page_type: "article"` — a site that has never published an article is a weak guest-post pitch,
because the "here are two things I've written" line in email 1 has nothing to point at.

## Pipeline

1. **Derive niches** — `deriveNiches(product.product_name, siteContext)`. The existing free-tool path
   passes a scraped homepage `SiteContext`; in the job, build the equivalent from `product_description`
   plus the highest-priority crawled `product_pages` rows instead of re-scraping the homepage.
2. **Build the query pool** — cross `GUEST_POST_QUERY_TEMPLATES` × niches. Note the current
   free-tool code slices to `queryTemplatesPerNiche: 3` deterministically, so it always uses the same
   3 footprints. **For rotation this must change**: build the full 6×N pool and select via
   `selectQueriesForRun(product.id, pool, MAX_QUERIES_PER_RUN)` (copy from
   `listicle-roundup/prospect-run-tracking.ts`) so repeat runs reach the other footprints.
3. **SERP** — `runApifyActor(SCRAPERLINK_GOOGLE_SERP, { keyword, limit: "20", country: "US", include_merged: false }, 90)`
   under `pLimit(3)`.
4. **Dedupe by domain**, drop own domain and `isNoiseDomain` hits, then drop domains already in
   `backlink_prospects` for this product **before** fetching — the step-2b pattern from
   `listicle-roundup/index.ts:121-129`.
5. **Fetch + qualify** — `fetchPageContent(url)`, then a new scorer that must confirm three things
   the free tool currently does not check:
   - the page is a live contribution invitation, not a blog post *about* guest posting (huge share of
     these footprints are SEO blogs writing about the tactic);
   - guidelines don't say "no links in author bio" / "nofollow all outbound";
   - the site publishes content in the derived niche, not merely mentions it.
   Score 1–5, keep `>= 3`.
6. **DR filter** — `enrichDomainRatings` only when `settings.dr_min > 0`, same as elsewhere.
7. **Site relevance** — `scoreSiteRelevance`.
8. **Persist + enrich** — bare rows with `tier: "guest_post_pitch"`, `found_url` = the write-for-us
   page, `target_url` = `product.website_url`. Store the matched footprint label in `raw_metadata` so
   the UI can show "Found via: write for us" (the free tool already returns `matchedFootprint`).
9. **Alert** — `helpers/emails/send-guest-post-alert.ts`.

## Outreach framing

New `OutreachContext` variant in `shared/generate-outreach-sequence.ts`:

```ts
| {
    opportunityType: "guest_post_pitch"
    title: string
    foundUrl: string
    niche: string
    guidelinesNote: string | null   // e.g. "asks for 1200+ words, no promotional links"
    proposedAngles: string[]        // 2-3 topic ideas derived from product_pages keywords
  }
```

`buildFraming` branch: the ask is **pitch 2–3 specific article ideas**, not "can I write for you".
Generic guest post pitches get ignored; named angles that fit the blog's existing coverage do not.
Pull the angles from `product_pages.keywords` on high-priority `article` rows so they're topics the
founder can credibly write about. Email 2 should offer a different angle than email 1; email 3 should
offer to send a full outline.

## Cost per run

Cheapest of the SERP-based strategies: 1 niche-derivation LLM call, ~4–6 SERP calls at `limit: "20"`,
~15–25 page fetches, 2 LLM scoring batches, then contact enrichment per qualified prospect (the
dominant cost, same as every other strategy).

## Rotation / exhaustion notes

The 6-footprint × 2-niche pool is only ~12 queries and these SERPs are **very stable** — the same
"write for us" pages rank for months. Expect this strategy to mine out fast per product. Mitigations:

- Widen the footprint list (`"contribute to"`, `"submit an article"`, `intitle:"contributor guidelines"`,
  `"guest author"`) — cheap, more pool depth.
- Widen niches: `deriveNiches` currently caps at `maxNiches: 2` (`types.ts:46`). 4–5 niches multiplies
  the pool without new code.
- This is the strategy most in need of the zero-yield cooldown in `00-shared-groundwork.md` §3b.

## Open questions

- **Does a guest post opportunity belong in the same queue as link edits?** The user's obligation is
  larger (write an article), so `status: "new"` may be misleading. May want a distinct badge or an
  effort indicator in the queue rather than a new opportunity shape.
- **Should the free tool and the job share the query plan?** They'd drift otherwise. Prefer extracting
  the shared plan builder and letting the route keep its deterministic slice while the job rotates.
- Guest posting has an SEO reputation problem. Keep the product language on *contributing an article
  to a relevant publication*, per CLAUDE.md's "avoid generic SEO wording" guidance — and never imply
  placement is guaranteed.
