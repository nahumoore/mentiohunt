# Shared groundwork for any new discovery strategy

**Status: Proposal — not actioned**

Every strategy ticket in this folder assumes this file. Read it first so the per-strategy tickets can
stay focused on discovery logic.

## 1. Per-strategy checklist (the fixed cost of adding one strategy)

| Step | File | Note |
|---|---|---|
| Add enum value | Supabase migration on `prospect_tier` | Covers **both** `backlink_prospects.tier` and `backlink_prospect_runs.strategy` — `strategy` is typed as the same enum (`packages/supabase/database-types.ts:74`) |
| Regenerate DB types | `packages/supabase/database-types.ts` | `prospect_tier` union at `:1101` and the values array at `:1271` |
| Server type list | `methods/prospect-generation-methods/shared/opportunity-types.ts` | `ALL_OPPORTUNITY_TYPES` — the fallback when a product has no settings row |
| Rotation registration | `jobs/daily-backlink-discovery.ts` | `RotationStrategy` union (`:21`), `ROTATION_STRATEGIES` (`:27`), `STRATEGY_HANDLERS` (`:62`) |
| Discovery method | `methods/prospect-generation-methods/<name>/index.ts` | Must match the `StrategyHandler.discover` signature: `(product, filterSettings, emailSettings) => { prospectsCreated, totalCostUsd }` |
| Run tracking | `<name>/prospect-run-tracking.ts` | Copy `listicle-roundup/prospect-run-tracking.ts` — `createProspectRun` / `completeProspectRun` / `failProspectRun`, plus `selectQueriesForRun` if the strategy has a query pool |
| Relevance scorer | `<name>/score-*.ts` | Copy the shape of `score-listicle-relevance.ts`; **pick a primary model that isn't already overloaded** — see note 4 |
| Enrichment | `<name>/enrichment.ts` | Wraps `enrichContact(...)` + `generateOutreachSequence(...)`, returns `EnrichedColumns` |
| Outreach framing | `shared/generate-outreach-sequence.ts` | Add to the `OpportunityType` union (`:12`), the `OutreachContext` union (`:14`), and a branch in `buildFraming` (`:89`) |
| Alert email | `helpers/emails/send-<name>-alert.ts` | Must accept exactly `{ to, userId, userName, productName, prospectsCreated }` — the shape `StrategyHandler.sendAlert` calls with |
| Web config | `apps/web/lib/opportunity-types.ts` | `OpportunityType`, `DEFAULT_PROSPECT_TIERS`, `TYPE_CONFIG`, `OPPORTUNITY_TYPE_TO_PROSPECT_TIER`, `PROSPECT_TIER_CONFIG` — all five, plus a Tabler icon |

Free for all new strategies, no work needed: outreach scheduling (`assignSequences` is called by the
job whenever `prospectsCreated > 0`), reply detection and sequence stop, unsubscribe, DR filtering
via `shared/enrich-domain-ratings.ts`, site-level scoring via `shared/score-site-relevance.ts`,
dedupe against `backlink_prospects`, and the per-product spend budget.

## 2. Extract the insert/enrich tail before strategy #5

The last ~100 lines of all four existing strategies are near-identical:

- `listicle-roundup/index.ts:245-349`
- `resource-page-inclusion/index.ts:273-385`
- `unlinked-mention/index.ts:229-333`
- `competitor-backlink/process-competitor.ts:122-243`

Same sequence every time: score site relevance → claim budget synchronously → build bare rows →
`upsert` with `onConflict: "product_id,found_url", ignoreDuplicates: true` → map ids by url → set
`enrichment_status: "enriching"` → enrich under `pLimit(5)` → write `ready`/`failed` +
`new`/`email_not_found` → fire `onProspectCreated`.

Proposed extraction — `shared/persist-and-enrich.ts`:

```ts
persistAndEnrich<T>({
  product,
  items: T[],
  tier: RotationStrategy,
  budget,
  toRow: (item: T, siteRelevance: number | null) => ProspectInsert,
  enrich: (item: T) => Promise<EnrichedColumns>,
  onProspectCreated,
}): Promise<{ prospectsCreated: number; costUsd: number }>
```

The subtle invariant worth preserving in a comment (it's already documented in three places): budget
must be claimed **synchronously before insert**, otherwise a budget-skipped row sits in `pending`
forever and gets deduped out of every future run because `found_url` already exists.

Doing this once turns each new strategy into roughly: query plan + qualifier + framing + alert email.

## 3. Rotation starves as strategies are added

`selectStrategyForRun` (`daily-backlink-discovery.ts:111`) picks **one** least-recently-started
runnable strategy per product per day. At 4 strategies each runs every ~4 days. At 15 it's every ~15
days — meaning a strategy that reliably produces good prospects gets the same share of the calendar
as one that has been returning zero for a month.

Two problems, both worth fixing before the list grows:

**a. No yield signal in selection.** `backlink_prospect_runs.prospects_created` is already stored per
run. Selection could weight by recent yield instead of pure staleness — e.g. sort by
`last_run_at` but push a strategy back if its last N runs all produced 0.

**b. `isRunnable` catches never-runnable, nothing catches mined-out.** A product whose listicle SERP
pool is exhausted still burns its daily slot plus Apify calls to insert nothing. Suggested: track
consecutive zero-yield runs per (product, strategy) and apply an escalating cooldown
(skip 1 run after 2 zeroes, 3 runs after 4 zeroes, etc.), resetting on any non-zero run. That also
naturally makes room for the strategies that *are* producing.

**c. Consider more than one strategy per product per day**, scaled by tier — the per-product spend
budget already bounds cost, so the one-per-day rule is doing a job the budget could do better.

## 4. Don't pile onto the already-congested models

`todo/tickets/2026-07-21-llm-shared-model-concurrency.md` established that `qwen3.6-flash` has
exactly **1** eligible provider and `glm-4.7-flash` has **2** under our
`provider.require_parameters: true` setting, and that the 07:00 UTC cron burst saturates them. The
per-model caps in `packages/openrouter/generate-text.ts` are sized to that.

Each new strategy adds at least one more scorer to that burst. When adding one:

- Anchor its primary on `deepseek-v4-pro` (7+ providers) rather than adding a 3rd/4th call site to
  glm or qwen.
- Keep `openai/gpt-5.6-luna` as last-resort fallback, consistent with everything else.
- Assume `PRODUCT_CONCURRENCY = 5` products × the strategy's internal `pLimit` when estimating the
  burst it contributes.

## 5. Scraper pressure

New strategies that fetch pages must go through the existing shared limiters
(`helpers/scraper-limits.ts` client-side, `_light_semaphore`/`_heavy_semaphore`/stealthy pool
server-side) rather than calling the scraper service directly — see
`todo/tickets/2026-07-22-stealthy-browser-context-crash.md` for what happens when concurrent load
exceeds what the shared browser context survives. `fetchPageContent`
(`listicle-roundup/check-listicle-client.ts`) and `checkMention` already route through them; reuse
those instead of writing new fetch clients.
