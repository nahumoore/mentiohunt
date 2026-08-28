# 03 — Editorial guest contributions (`guest_post_pitch`)

- **Status:** Proposed — not started
- **Priority:** P2 (first genuinely new opportunity type; carries the full enum cost)
- **Depends on:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md`; the
  [enum checklist](README.md#enum-checklist-referenced-by-03-04-05)
- **Adds enum value:** `guest_post_pitch`

## Why this one

`methods/guest-post-sites/` already implements niche derivation, six search footprints, SERP
discovery, per-domain dedupe, and relevance scoring — but only for the public free tool; nothing is
persisted. It reaches a different pool from every current strategy and makes a distinct offer (useful
expert content, not an edit to an existing page), and it stays runnable for products with weak
brand-search volume or a thin backlink profile — exactly the products that miss 25 today.

## What exists today

- **Method:** `apps/server/src/methods/guest-post-sites/` — `types.ts`, `derive-niches.ts`,
  `find-guest-post-sites-by-url.ts`. **Purely ephemeral: no `supabaseAdmin` import, no DB writes.**
- **Footprints:** `guest-post-sites/types.ts:36-43` `GUEST_POST_QUERY_TEMPLATES` — six, keyed on
  `{niche}`: `"write for us"`, `"guest post"`, `"submit a guest post"`, `"become a contributor"`,
  `intitle:"write for us"`, `"guest post guidelines"`.
- **Limits:** `types.ts:45-52` `DEFAULT_LIMITS` — `maxNiches: 2`, `queryTemplatesPerNiche: 3` (only
  the first three templates are ever used), `serpResultsPerQuery: "20"`, `maxCandidates: 40`,
  `maxSites: 10`. `buildQueryPlan` (`find-guest-post-sites-by-url.ts:34-44`) is the cross-product of
  niches × first-3 templates.
- **Niche derivation:** `guest-post-sites/derive-niches.ts` — one LLM call, "1-2 short topical niche
  phrases (2-4 words), not the brand name", falls back to `[productName]` on failure. Already shared:
  `broken-link-building/find-broken-link-candidates-by-url.ts:6` imports `deriveNiches`.
- **Scoring:** delegates to the shared `scoreSiteRelevance`
  (`find-guest-post-sites-by-url.ts:119-122`) but does not pass `target_keywords` (the free tool has
  none).
- **Consumers:** server route `apps/server/src/routes/free-tool-guest-post-sites.ts:36` (internal API
  key + IP rate limit), web BFF `apps/web/app/api/free-tool/guest-post-sites-finder/route.ts`, UI
  `apps/web/app/free-tools/guest-post-sites-finder/`. Not wired into the dashboard, rotation, or any
  `prospect_tier`.
- **Shared plumbing to reuse:** `shared/persist-and-enrich.ts`,
  `shared/discovery-candidate-backlog.ts` (`BacklogSource` union `:9-13` currently only
  `listicle_roundup | resource_page_inclusion | unlinked_mention` — add `guest_post_pitch`),
  `shared/score-site-relevance.ts`, `shared/enrich-domain-ratings.ts`.

## Implementation

1. **New discovery method** `methods/prospect-generation-methods/guest-post-pitch/index.ts` matching
   the `StrategyHandler.discover` signature. Copy `prospect-run-tracking.ts` from a sibling
   (listicle's has the query-pool selection shape).
2. **Rotate the full footprint set.** Use all six templates × 4–5 niches, with per-run
   least-recently-run selection persisted into `backlink_prospect_runs.input.queries` (same mechanism
   as listicle `selectQueriesForRun`). Do not keep taking the first three templates.
3. **Derive 4–5 evidence-backed niches** when `product.target_keywords` and crawled `product_pages`
   support them; fall back to fewer rather than inventing weak ones. Reuse `deriveNiches` (widen its
   output cap) or a product-aware variant.
4. **Qualify each candidate:** fetch the page and verify it actually solicits editorial contributions
   (a real write-for-us / contributor / guidelines page, not a stale link or a "we don't accept guest
   posts" notice), the site is active, and it is topically relevant. Reuse the fetch client pattern
   from `listicle-roundup/check-listicle-client.ts`.
5. **Exclude** paid placements, link-selling sites, and any policy that prohibits relevant contextual
   citations. If the guidelines page advertises "sponsored post" pricing, drop it.
6. **Generate 2–3 concrete article angles** from the customer's crawled `product_pages`, stored in
   `raw_metadata.outreach_context` so the outreach draft proposes specific topics.
7. **Persist through the shared tail** — `persistAndEnrich` + the backlog table. Add the new
   `BacklogSource`.
8. **Enum + framing + web config** per the [checklist](README.md#enum-checklist-referenced-by-03-04-05).
   New `OutreachContext` variant `{ opportunityType: "guest_post_pitch"; siteTitle; foundUrl;
   contributionPageUrl; articleAngles: string[] }` and a `buildFraming` branch: introduce the sender
   as an operator in {niche}, name one specific angle, ask if the editor is open to a contribution.
   Alert email `send-guest-post-pitch-alert.ts` with the standard
   `{ to, userId, userName, productName, prospectsCreated }` shape.

## Safety constraints

- **Editorial contribution outreach, not automated guest-post link placement.** Never promise or
  imply payment, specific anchor text, followed links, or ranking value in the draft or the framing.
- Google treats paid or large-scale guest-post links with optimized anchors as link spam — the pitch
  is "I'll write something useful for your readers", full stop.
- No paid-placement networks: if qualification detects a price list or a "sponsored content" rate,
  the candidate is rejected, not enriched.

## Evaluation / success signal

Broad product coverage (it should produce for products that competitor/listicle discovery cannot) and
incremental ready domains with acceptable editorial quality and no evidence of paid-placement
networks in the accepted set. Track eligible-product coverage, new unique domains after dedupe, ready
conversion, and reply/positive-reply rate. Keep it disabled if accepted candidates skew toward
low-quality or link-selling sites.

## Tests

- Query plan rotates all six footprints across runs; a run does not repeat the previous run's exact
  query set while unused footprints remain.
- A candidate whose fetched page does not solicit contributions is rejected.
- A candidate whose guidelines page advertises paid/sponsored placement is rejected.
- Article angles are derived from `product_pages` and stored on the prospect's `raw_metadata`.
- `guest_post_pitch` is handled by persistence, sequencing, alerts, the five web maps, and the
  regenerated `prospect_tier` type — no `as string` cast workarounds.
- The backfill migration adds `guest_post_pitch` to `opportunity_types` only for products that still
  hold the complete prior default set.
- A cross-strategy duplicate domain does not count as incremental output.

## Relevant files

- `apps/server/src/methods/guest-post-sites/` (source to lift from)
- `apps/server/src/methods/prospect-generation-methods/guest-post-pitch/` (new)
- `apps/server/src/methods/prospect-generation-methods/shared/discovery-candidate-backlog.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/persist-and-enrich.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/opportunity-types.ts`
- `apps/server/src/jobs/daily-backlink-discovery.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/strategy-rotation.ts`
- `apps/web/lib/opportunity-types.ts`
- `packages/supabase/database-types.ts`
- `supabase/migrations/` (enum + backfill pair)
- `supabase/migrations/20260806160000_add_broken_link_building_prospect_tier.sql` (precedent)

## Research references

- Google Search spam policies (paid/automated/optimized-anchor guest-post links):
  https://developers.google.com/search/docs/essentials/spam-policies
