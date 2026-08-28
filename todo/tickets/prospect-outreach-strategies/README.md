# Prospect outreach strategies — implementation set

Priority-ordered implementation tickets for the five strategies ranked in
`todo/tickets/2026-08-27-research-additional-opportunity-strategies.md`. That ticket did the research
and the ranking; these tickets turn each rank into buildable work.

**Why this set exists:** one full rotation of today's five discovery strategies produces only ~7.8
send-ready opportunities per product, against an advertised `~25`/product/day. The renewable source
pool is not deep enough to assume the current strategies alone will close that gap.

**Hard dependency:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md` must land first. It
provides the trustworthy per-product/day accounting, the shared stop controller (daily target /
attempt cap / cost cap), the common strategy funnel, and the consolidated
`shared/persist-and-enrich.ts` tail that every ticket here builds on. Do not start these until that
ticket's canary has passed.

**This set supersedes** the deleted 2026-07-24 proposal folder (`git show HEAD~:todo/tickets/...`).
That set predated broken-link building shipping, treated link intersection as a new strategy when it
now runs inside competitor discovery, and depended on a removed Moz client. Its
`00-shared-groundwork.md` is obsolete: the persist/enrich consolidation it asked for now exists as
`apps/server/src/methods/prospect-generation-methods/shared/persist-and-enrich.ts`, and the rest of the
per-strategy boilerplate is covered by Phase 4 of the delivery-fix ticket plus the enum checklist
below.

## Build order

| # | Strategy | Adds enum value? | Engine reused | Effort |
|---|---|---|---|---|
| 01 | [Fresh + intersection competitor lanes](01-fresh-competitor-backlink-lanes.md) | No | `competitor-backlink/` — the strongest existing engine (5.78 ready/run, 85.6% contact success) | M |
| 02 | [Listicle discovery modes](02-listicle-discovery-modes.md) | No | `listicle-roundup/` — query pool + backlog already built | M |
| 03 | [Guest post pitch](03-guest-post-pitch.md) | `guest_post_pitch` | `methods/guest-post-sites/` — built for the free tool, never persisted | M |
| 04 | [Lost link reclaim](04-lost-link-reclaim.md) | `lost_link_reclaim` | DataForSEO backlinks endpoint (`backlinks_status_type: "lost"`) | S |
| 05 | [Integration ecosystem](05-integration-ecosystem.md) | `integration_ecosystem` | none — needs a new customer-confirmed integrations store first | L |

01 and 02 are first because they expand engines that already work and add **no enum value, no
migration, no web config** — the cheapest incremental yield. 03–05 each add a `prospect_tier` enum
value and carry the full per-strategy cost (see checklist). Introduce one lane/mode/type at a time so
its incremental output and cost are attributable, and canary each new outreach framing at low volume
before adding it to adaptive allocation.

## Shared success bar (every ticket)

- A strategy is successful only when it creates **incremental unique send-ready domains** after
  cross-strategy and existing-prospect domain dedupe *and* successful outreach-sequence persistence —
  never when it merely returns URLs. A duplicate domain, an `email_not_found` row, or a row whose
  sequence failed to persist does not count.
- Every new lane/mode/type must register in the shared daily target, attempt cap, cost cap, and
  domain deduplication — `shared/persist-and-enrich.ts`,
  `apps/server/src/jobs/daily-discovery-stop-controller.ts` — and record a distinct lane/mode in the
  common funnel schema so yield is attributable.
- Run each experiment on a representative sample (new/small sites, established sites, products with
  weak brand or competitor data), review false positives manually before enabling outreach, and keep
  it disabled if the incremental yield is mostly duplicates or low-quality contacts.

## Enum checklist (referenced by 03, 04, 05)

Adding a `prospect_tier` value touches all of the following. Precedent to copy:
`supabase/migrations/20260806160000_add_broken_link_building_prospect_tier.sql` +
`20260806161500_backfill_broken_link_building_opportunity_type.sql`.

| Step | File | Note |
|---|---|---|
| Enum migration (Supabase CLI) | `supabase/migrations/` | `prospect_tier` backs both `backlink_prospects.tier` and `backlink_prospect_runs.strategy` |
| Backfill migration | `supabase/migrations/` | add the new value to `opportunity_types` only for products that still hold the complete prior default set; never re-add a type a user disabled |
| Regenerate types | `packages/supabase/database-types.ts` | `prospect_tier` union (~L1779) and values array (~L1974) |
| Server fallback list | `apps/server/src/methods/prospect-generation-methods/shared/opportunity-types.ts` | `ALL_OPPORTUNITY_TYPES` |
| Rotation registration | `apps/server/src/jobs/daily-backlink-discovery.ts` | `RotationStrategy` union (~L47), `ROTATION_STRATEGIES` (~L54), `STRATEGY_HANDLERS` (~L98), `getUnrunnableReason` (~L293) |
| Adaptive prior | `apps/server/src/methods/prospect-generation-methods/shared/strategy-rotation.ts` | `DEFAULT_READY_PER_ATTEMPT` (~L21) |
| Discovery method | `apps/server/src/methods/prospect-generation-methods/<name>/index.ts` | matches `StrategyHandler.discover` signature; run tracking copied from a sibling's `prospect-run-tracking.ts` |
| Outreach framing | `apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts` | new `OutreachContext` variant (~L12) + `buildFraming` branch (~L135) |
| Alert email | `apps/server/src/helpers/emails/send-<name>-alert.ts` | shape `{ to, userId, userName, productName, prospectsCreated }` |
| Backlog source (if used) | `shared/discovery-candidate-backlog.ts` | `BacklogSource` union (~L9) |
| Web config | `apps/web/lib/opportunity-types.ts` | all five: `OpportunityType` (~L5), `DEFAULT_PROSPECT_TIERS` (~L14), `TYPE_CONFIG` (~L58), `OPPORTUNITY_TYPE_TO_PROSPECT_TIER` (~L96), `PROSPECT_TIER_CONFIG` (~L104) + a Tabler icon |

Free for every new strategy: outreach scheduling, reply detection / sequence stop, unsubscribe, DR
filtering (`shared/enrich-domain-ratings.ts`), site scoring (`shared/score-site-relevance.ts`),
per-product spend budget, dedupe against `backlink_prospects`.

## Do not build

- **Directories, directory submissions, marketplaces, submission forms, paid-placement networks,
  manual URL submissions.** Excluded by product decision. If a narrow market cannot produce 25
  legitimate unique contactable editorial opportunities, the daily system reports exhaustion rather
  than counting these.
- **A separate link-intersection strategy.** Page intersection already runs inside competitor
  discovery (`competitor-backlink/index.ts`). Ticket 01 promotes it to its own lane and measures it
  there.
- **A separate competitor-alternatives strategy.** It starts as a listicle mode in ticket 02 to avoid
  duplicating the persistence/enrichment pipeline. Promote it later only if the mode data justifies it.
- **Testimonial exchange** and **author repeat linker.** Later research, not this set. Testimonial
  exchange depends on customer-confirmed vendors and has finite supply — it fits onboarding /
  event-triggered discovery, not daily rotation. Author repeat linker needs person-level identity and
  dedupe; wrong attribution is a material reputation risk.
- **Anything social** or blog-comment / forum link drops. Ruled out by `CLAUDE.md` and positioning.
