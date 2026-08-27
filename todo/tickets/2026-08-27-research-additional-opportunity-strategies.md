# Research and validate additional opportunity strategies

- **Status:** Proposed — initial research complete, experiments not implemented
- **Priority:** P0
- **Scope:** Find, prototype, and validate renewable editorial opportunity sources that can close the
  gap between corrected existing discovery and `~25` send-ready opportunities per product/day.
- **Dependency:** `2026-08-27-fix-daily-opportunity-delivery.md` must provide trustworthy accounting,
  shared budgets, and common funnel measurements before strategy experiments are compared.
- **Explicitly out of scope:** Directories, directory submissions, marketplaces, submission forms,
  paid-placement networks, and manual URL submissions.

## Outcome

Produce enough additional, unique, contactable editorial inventory to make 25 achievable for a much
larger share of eligible products without lowering quality or disguising non-email actions as outreach
opportunities.

This ticket separates **finding supply** from fixing the scheduler. A strategy is successful only when
it creates persisted send-ready opportunities after domain deduplication and sequence creation—not
when it merely returns URLs.

## Why more strategies are necessary

Recent 14-day production performance was:

| Strategy | Runs | Average ready/run | Zero-result runs | Contact success after enrichment attempt |
|---|---:|---:|---:|---:|
| Competitor backlink | 81 | 5.78 | 15 | 468 / 547 (85.6%) |
| Listicle roundup | 78 | 0.88 | 51 | 69 / 73 (94.5%) |
| Broken link building | 45 | 0.67 | 30 | 30 / 36 (83.3%) |
| Unlinked mention | 87 | 0.26 | 73 | 23 / 24 (95.8%) |
| Resource page inclusion | 56 | 0.23 | 30 | 13 / 66 (19.7%) |

One average run of every current source creates only about 7.8 send-ready opportunities. Larger
adaptive limits and repaired backlog processing may help, but the renewable source pool is not deep
enough to assume current strategies alone will reach 25 for every product.

The existing proposal folder predates several August changes:

- Broken-link building is already shipped; do not rebuild it.
- Link intersection already runs inside adaptive competitor discovery through DataForSEO's live page
  intersection endpoint; do not duplicate it as a separate strategy.
- Competitor-alternative queries already exist in `build-listicle-queries.ts`, but coverage is shallow
  and downstream scoring/framing is generic.
- The removed Moz client is unnecessary. Current DataForSEO endpoints support lost backlinks,
  `is_new`, `is_lost`, `first_seen`, `last_seen`, and spam fields.

## Evaluation method

Every candidate strategy begins as a measured discovery lane or shadow experiment. Compare it on:

- eligible-product coverage;
- new unique domains after cross-strategy and existing-prospect deduplication;
- candidates gathered, fetched, qualified, and enrichment-attempted;
- contact-ready and sequence-ready conversion;
- median incremental send-ready output per eligible product/day;
- zero-result rate and time until the source exhausts;
- cost and runtime per incremental send-ready row;
- bounce, dismissal, reply, and positive-reply signals after a safe observation window;
- how quickly the inventory renews.

Do not promote a strategy because it finds many URLs. It must contribute incremental sequence-ready
domains without materially worsening relevance, safety, cost, or sender reputation.

For each experiment:

1. Record a distinct lane/mode in the common funnel schema.
2. Run on a representative sample spanning new/small sites, established sites, and products with weak
   brand or competitor data.
3. Preserve the same daily attempt/cost caps as production discovery.
4. Review false positives manually before enabling outreach.
5. Canary outreach at low volume before adding it to adaptive allocation.
6. Keep it disabled if the incremental yield is mostly duplicates or low-quality contacts.

## Ranked strategy research

### Rank 1 — fresh and intersection-prioritized competitor backlinks

**Type:** expansion of the strongest existing engine, not a new user-facing opportunity type.

Why first:

- Competitor backlinks already average 5.78 ready rows/run with 85.6% contact success.
- Auto-discovered competitors and page intersection already exist.
- Authority-first sorting repeatedly favors older inventory. DataForSEO exposes `is_new`, `first_seen`,
  and `last_seen`, allowing a different renewable lane.

Experiment:

1. Alternate or mix authority-ranked and `is_new = true` batches per competitor.
2. Store `authority`, `fresh`, or `intersection` as lane metadata.
3. Prioritize intersection and fresh editorial candidates ahead of generic authority candidates.
4. Keep independent cursors/history so one lane cannot starve another.
5. Describe freshness as crawler discovery; never invent an exact publication date.

Success signal: meaningful incremental unique send-ready domains beyond today's authority-ranked pool,
with comparable contact and quality rates.

### Rank 2 — specialized listicle modes

**Type:** expansion of the existing listicle engine, not duplicated persistence/enrichment pipelines.

Why second:

- Recent runs gathered 11,021 candidates but fetched only 978 and produced 69 ready rows.
- Query and backlog infrastructure already exist.
- Existing scoring downranks abandoned/outdated listicles even when a specific refresh pitch is valid.
- Competitor-alternative searches exist but use shallow query coverage.

Research these modes:

1. `current_category_listicle` — existing behavior and control group.
2. `competitor_alternatives` — rotate exact alternatives, best alternatives, competitor-vs, and
   category-qualified variants. Require the competitor to appear and the customer product to be absent.
3. `stale_refresh` — accept genuine listicles that are visibly stale but still reachable. Require
   concrete, non-invented staleness evidence and a recently active host.

Return the mode, evidence, named products, product-presence state, and mode-specific fit score in the
same scoring pass where possible. Persist the mode so outreach framing is specific.

Success signal: turn already-paid SERP/backlog inventory into incremental high-intent opportunities
without increasing generic or misleading pitches.

### Rank 3 — editorial guest contributions

**Type:** first genuinely new strategy, proposed as `guest_post_pitch`.

Why third:

- `methods/guest-post-sites/` already implements niche derivation, six search footprints, SERP
  discovery, domain dedupe, and relevance scoring for the free tool.
- It reaches a different pool and makes a distinct offer: useful expert content rather than editing an
  existing page.
- It remains runnable for products with weak brand-search volume or a small backlink profile.

Prototype requirements:

1. Rotate every footprint/niche combination instead of repeatedly taking the first three templates.
2. Derive 4–5 evidence-backed niches when product keywords and crawled pages support them.
3. Fetch and verify that the page accepts editorial contributions and that the site is active and
   topically relevant.
4. Exclude paid placements, link-selling sites, and policies prohibiting relevant contextual citations.
5. Generate two or three concrete article angles from the customer's crawled target pages.
6. Feed qualified results through the shared persistence, enrichment, sequence, and funnel path.

Safety constraint: this is editorial contribution outreach, not automated guest-post link placement.
Never promise payment, anchor text, followed links, or ranking value. Google treats paid or large-scale
guest-post links with optimized anchors as link spam.

Success signal: broad product coverage and incremental ready domains with acceptable editorial quality
and no evidence of paid-placement networks.

### Rank 4 — lost-link reclamation

**Type:** high-fit supplemental strategy, not the primary volume engine.

Why:

- The referring site previously made an editorial decision to link to the customer.
- DataForSEO's current backlinks endpoint accepts `backlinks_status_type: "lost"`; restoring Moz is not
  required.
- The pool renews, but small/new products may have little or nothing to reclaim.

Prototype requirements:

1. Query own-domain lost backlinks with a bounded recent filter using supported fields.
2. Verify that the source page is live and the customer link is truly absent.
3. Separate a removed link on a live page from a dead source page; only the former belongs in v1.
4. Prefer reclaim framing when the same URL also appears as an unlinked mention.
5. Schedule periodically or based on measured lost-link volume, not in every daily rotation forever.

Success signal: lower volume but strong relevance, reply, and positive-reply performance.

### Rank 5 — integration-ecosystem editorial pages

**Type:** cohort-specific new strategy.

Why:

- Integration blogs and third-party ecosystem roundups have strong factual audience fit for B2B SaaS.
- Inventory expands as integrations ship.
- Incorrectly inferred integrations would create visibly false outreach claims.

Prerequisite and prototype:

1. Let customers confirm and edit integrations; crawling/LLM output may only suggest them.
2. Search third-party editorial pages about confirmed ecosystems.
3. Exclude vendor marketplaces, GitHub pull-request lists, submission forms, and other non-email actions.
4. Require that the product is absent and every integration claim comes from confirmed data.

Success signal: strong incremental yield for integration-heavy products. Treat it as cohort expansion,
not a universal route to 25.

## Later research, not part of the initial build

- **Testimonial exchange:** potentially high acceptance, but finite and dependent on
  customer-confirmed vendors. It fits onboarding/event-triggered discovery better than daily supply.
- **Author repeat linker:** promising compounding inventory, but requires person-level identity and
  dedupe. Incorrect attribution creates material reputation risk.
- **Separate link-intersection type:** already available as a competitor lane; measure it there first.
- **Separate competitor-alternatives type:** start as a listicle mode to avoid duplicating the pipeline.
- **Directories and submission marketplaces:** excluded by product decision.

## Shared implementation requirements

Before adding `guest_post_pitch` or another enum value:

- complete the shared persistence/enrichment path from the fixes ticket;
- create enum/schema migrations through the Supabase CLI;
- regenerate database types;
- update server and web opportunity mappings, copy, and alert handling;
- add new types to defaults only for users who still have the prior complete default set;
- never re-enable a strategy that a user intentionally disabled;
- add the strategy to common target, attempt, cost, and domain-deduplication controls.

## Tests

- Fresh competitor lane filters and cursors are independent from authority/intersection lanes.
- All listicle modes emit correct qualification and framing metadata.
- Stale-refresh candidates require concrete staleness evidence.
- Guest-contribution candidates must be live, topical, editorial, and non-paid.
- Lost-link candidates require a live page with the customer link verified absent.
- Integration claims use only customer-confirmed data.
- Cross-strategy duplicate domains do not count as incremental output.
- A strategy cannot exceed shared daily attempt or cost caps.
- Every new enum value is handled by persistence, sequencing, alerts, UI copy, and generated types.

## Rollout and acceptance

1. Complete trustworthy daily accounting from the fixes ticket.
2. Test Rank 1 and Rank 2 improvements before introducing a new opportunity type.
3. Introduce one lane/mode at a time so incremental output and cost are attributable.
4. Canary each outreach framing at low volume and review samples before broader rollout.
5. Retain only strategies that add unique send-ready domains and pass safety/quality review.
6. Measure the combined system over a rolling 14-day window:
   - median eligible product-day reaches 25 send-ready opportunities;
   - at least 80% of eligible product-days reach 25 as the first rollout gate;
   - zero-opportunity product-days fall below 5%;
   - bounce, dismissal, reply quality, scraper errors, and daily cost do not materially regress.

No strategy should manufacture weak rows solely to reach a counter. If a narrow market cannot produce
25 legitimate, unique, contactable editorial opportunities, the daily system must report exhaustion
rather than count directories, submission actions, or unsafe placements.

## Relevant files

- `todo/tickets/prospect-outreach-strategies/`
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/`
- `apps/server/src/methods/guest-post-sites/`
- `apps/server/src/methods/prospect-generation-methods/shared/`
- `apps/server/src/processes/onboarding/prospect-sequences.ts`
- `apps/web/lib/opportunity-types.ts`
- `supabase/migrations/`

## Research references

- DataForSEO backlinks endpoint and `backlinks_status_type`:
  https://docs.dataforseo.com/v3/backlinks-backlinks-live/
- DataForSEO backlink filters (`is_new`, `is_lost`, `first_seen`, `last_seen`):
  https://docs.dataforseo.com/v3/backlinks-filters/
- DataForSEO page intersection endpoint:
  https://docs.dataforseo.com/v3/backlinks-page_intersection-live/
- Google Search spam policies for paid/automated/optimized-anchor guest-post links:
  https://developers.google.com/search/docs/essentials/spam-policies
