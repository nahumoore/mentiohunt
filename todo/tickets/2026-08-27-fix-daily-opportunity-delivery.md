# Fix daily opportunity delivery and accounting

- **Status:** Implementation complete — Phases 1–4 are implemented and verified locally. The
  accounting migration is live; the backlog migration, application deploy, and two-day canary remain.
- **Priority:** P0
- **Scope:** Correctness, scheduling, candidate allocation, backlog processing, and observability for
  the existing opportunity-discovery system.
- **Related ticket:** `2026-08-27-research-additional-opportunity-strategies.md` owns finding and
  validating additional sources of opportunity inventory.
- **Out of scope:** New opportunity strategies, directory discovery/submissions, marketplace
  submission forms, and counting manual URL submissions toward the daily target.

## Outcome

Make the pricing target of `~25 daily backlink opportunities` behave as one accurate per-product daily
quota. The system must top up the same quota across scheduled runs, count only persisted send-ready
opportunities, stop within explicit cost/attempt limits, and record why a product did not reach 25.

For this ticket, a **send-ready opportunity** means all of the following are true:

- it is a newly discovered, unique domain for the product;
- it passed strategy-specific editorial-fit checks;
- `backlink_prospects.enrichment_status = 'ready'`;
- it has a non-null verified or explicitly accepted best-effort contact email;
- it has a usable first email and a successfully persisted outreach sequence;
- it came from automated discovery, not `user_submitted`.

An inserted bare prospect, an `email_not_found` row, or a row whose sequence failed to persist does not
count toward 25.

Use a **UTC calendar day** for the quota because products do not currently store a timezone and both
discovery crons use UTC. If product timezones are added later, change the boundary deliberately.

This ticket makes delivery correct and measurable; it does not assume the existing source pool is
large enough to reach 25 for every product. Additional inventory is handled by the related strategy
research ticket.

## Production baseline

Production was queried read-only on 2026-08-27. There were 18 eligible products, all with adaptive
discovery enabled, target 25, and candidate cap 40. The preceding seven UTC days showed:

| UTC day | Eligible product-days | Send-ready | Average per product | Products at 25 | Products at 0 |
|---|---:|---:|---:|---:|---:|
| 2026-08-21 | 8 | 36 | 4.50 | 0 | 4 |
| 2026-08-22 | 9 | 60 | 6.67 | 0 | 2 |
| 2026-08-23 | 9 | 16 | 1.78 | 0 | 6 |
| 2026-08-24 | 10 | 11 | 1.10 | 0 | 7 |
| 2026-08-25 | 14 | 43 | 3.07 | 0 | 9 |
| 2026-08-26 | 17 | 60 | 3.53 | 0 | 9 |
| 2026-08-27 | 18 | 44 | 2.44 | 0 | 7 |

The rollout was enabled after the 07:03 UTC scheduled run on 2026-08-27. These numbers establish the
underlying shortfall but do not yet measure a full adaptive cycle. Validation must cover complete UTC
days and both paid cron windows.

There were also 824 candidates in `pending` or `retry`: 488 listicle, 301 resource-page, and 35
unlinked-mention candidates. They are concentrated in a minority of products and cannot be treated as
a universal solution, but correct backlog processing can improve short-term delivery.

## Current correctness gaps

### 1. New products fall back to legacy defaults

The production schema change previously represented by
`20260826181258_add_adaptive_discovery_settings.sql` created these defaults:

- `adaptive_discovery_enabled = false`
- `daily_discovery_target = 10`
- `daily_discovery_candidate_cap = 15`

Onboarding only supplies `product_id` and `opportunity_types`. The 2026-08-27 rollout updates existing
settings rows but leaves defaults unchanged, so products created after the backfill can silently return
to single-source discovery.

The schema-creation migration is currently absent from the repository. The rollout SQL is now tracked,
but it was executed against production outside migration history when audited. Reconcile both sides of
that drift before further schema work.

### 2. The daily target is implemented per invocation

Paid products run at 07:03 and 19:03 UTC. `runDiscoveryForProduct` initializes
`sendReadyCreated = 0` on every invocation and does not load the day's existing output. The second run
therefore aims at another 25 rather than topping up the same daily quota.

There is no product/day execution lock. A slow run, another server replica, onboarding, or a manual
invocation can overlap and process the same product concurrently.

### 3. The scheduler counts rows before they are send-ready

`onProspectCreated` increments the count when contact enrichment returns an email, before
`createSequencesForProspect` resolves. Sequence writes use `Promise.allSettled`, but failures do not
decrement the count. It also increments when no sending account exists and no sequence task is made.

### 4. Four strategies can overshoot the remaining target

Only `competitor_backlink` converts `targetRemaining` into `maxProspects`. Unlinked mentions,
listicles, resource pages, and broken links receive the entire remaining candidate budget. Target and
cost checks happen only between sources, so a method can overshoot or overspend before returning.

### 5. Allocation optimizes the wrong outcome

Adaptive ordering uses recent send-ready output per dollar. The daily objective, however, is to reach
the quota before exhausting the attempt cap. A cheap, low-volume or low-contact source can rank above
a source with a much better probability of producing a ready opportunity.

Resource-page inclusion is the clearest example: only 19.7% of its recent enrichment attempts became
ready, versus 83–96% for the other sources. It can consume much of the shared cap and make the target
unreachable.

### 6. Source suppression can become permanent

`shouldExploreUnlinkedMentions` skips the source after low-volume runs. Once skipped, no new run can
enter history to show that volume recovered. This is a permanent self-lock rather than a cooldown.

Broken-link discovery is intentionally weekly. Keep that cadence unless data justifies changing it;
report it as supplemental inventory rather than an unexplained daily skip.

### 7. Some user-selected configurations cannot run

The UI requires one enabled type but not one runnable type. Production included an active product with
only broken-link discovery enabled and no competitors, so it could not produce a run. Preserve user
choice, but clearly block or warn about configurations that cannot attempt the advertised target.

### 8. Candidate claiming and retries are incomplete

- `claimDiscoveryCandidates` selects `limit` rows before removing existing prospects and duplicate
  domains, returning a short batch instead of refilling it.
- Claiming is select-then-update rather than atomic, allowing overlapping workers to select the same
  rows.
- `attempt_count` is never incremented.
- Retries have no terminal attempt limit.
- Candidate upserts must not reactivate `processed` or terminally discarded rows.

### 9. Stop reasons are log-only and scheduler behavior is untested

`target_reached`, `candidate_cap_reached`, `cost_cap_reached`, and `sources_exhausted` are returned and
logged but not persisted as a daily product result. The database cannot reconstruct whether the quota
was met or why it was missed.

Rotation helpers have unit tests, but the daily runner, adaptive selection, daily top-ups, candidate
allocation, sequence failures, and overlapping executions do not.

## Implementation plan

### Phase 1 — correct defaults, quota accounting, and concurrency

1. Reconcile production migration history with the normal Supabase workflow. Do not run a second blind
   backfill that might overwrite newer user settings.
2. Change new-setting defaults to adaptive enabled, target 25, and a configurable hard enrichment
   attempt cap initially set to 80 for the canary—not assumed final.
3. Set these values explicitly in onboarding and fallback creation paths. Settings updates must
   preserve them.
4. Backfill only eligible products that still have legacy defaults; preserve intentional custom
   values.
5. Add one internal daily summary per `(product_id, UTC date)` containing:
   - target and ready count at start;
   - ready opportunities added;
   - enrichment attempts and inserted-but-not-ready count;
   - cost and strategy funnels;
   - final stop/configuration reason;
   - timestamps and last error.
6. Keep the summary internal. Enable RLS and revoke `anon`/`authenticated` access unless a user-facing
   API is deliberately designed later.
7. Claim a product/day execution atomically in Postgres. Concurrent workers must reuse or skip the
   active summary; stale claims may be recovered after a bounded timeout.
8. Start each invocation by counting persisted automated send-ready opportunities for that UTC day and
   calculate `remaining = max(0, target - readyToday)`. The 19:03 run is a top-up.
9. Count only after sequence persistence succeeds. Reconcile the final number from database rows rather
   than trusting callback counters.

### Phase 2 — enforce shared target and budget controls

1. Define one strategy result shape with candidates gathered, fetched, qualified, and attempted; rows
   inserted; contact-ready and sequence-ready counts; metered cost; transport failures; and
   exhaustion/cursor state.
2. Pass one stop controller to every strategy. It exposes daily remaining count, attempt budget, and
   cost budget.
3. Check limits inside bounded batches. Do not start a 50-row enrichment batch when two ready rows are
   needed.
4. Estimate attempts from a conservative rolling ready-per-attempt rate, bounded by the global cap.
5. Rank sources primarily by expected ready output and ready-per-attempt, using cost and latency as
   constraints. Reserve a small exploration allocation for recovered sources.
6. Cap low-contact sources. Resource pages must not consume most of the daily budget while higher-yield
   sources remain runnable.
7. Replace permanent unlinked-mention suppression with a time-based small re-probe.
8. Persist weekly broken-link availability and every other skip reason in the daily summary.
9. Return a precise configuration reason when selected sources cannot run.

### Phase 3 — repair and drain the candidate backlog

1. Replace select-then-update claiming with an atomic database function using row locking and
   `SKIP LOCKED`, scoped to product and source.
2. Claim N unique, non-prospect domains, refilling past duplicates rather than returning a short batch.
3. Increment `attempt_count` atomically when claimed.
4. Add staged retry delays and a terminal discarded state after an explicit maximum; persist the final
   failure reason.
5. Allow rediscovery to update freshness/priority without resetting terminal state.
6. Record backlog age, state, retry, duplicate, and conversion metrics.
7. Drain existing inventory under the same daily target and budgets; do not run an unbounded sweep.

### Phase 4 — consolidate the shared persistence tail

The five strategies duplicate site scoring, budget claim, bare-row insertion, enrichment, status
updates, and scheduler callbacks. Extract a shared `persistAndEnrich`-style path with these invariants:

- claim budget synchronously before insertion;
- enrich only newly inserted rows;
- allow at most one prospect per normalized root domain per product;
- report sequence-ready, not merely contact-ready, output;
- distinguish enrichment failures from email-not-found outcomes;
- keep callback state reconcilable with persisted counts;
- record the common funnel for every strategy.

This is also a prerequisite for adding new strategies without copying the existing correctness bugs.

## Tests

### Scheduler

- A product with 18 ready opportunities today starts with `targetRemaining = 7`.
- The 19:03 run tops up rather than resetting the quota.
- A product already at 25 performs no discovery.
- New trial and paid products use intended defaults and cannot silently enter legacy mode.
- Missing settings or query failures do not silently lower the target.
- Sequence insertion failure and missing sending account do not increment ready count.
- Every strategy obeys target, attempt, and cost signals inside bounded batches.
- Resource pages cannot consume more than their allocation while higher-yield sources remain.
- Unlinked mentions are re-probed after a low-volume cooldown.
- Broken-link-only without prerequisites returns a configuration reason.
- Concurrent claims for the same product/day cannot both run.

### Candidate backlog

- Claims return N unique eligible domains when N exist beyond duplicates.
- Concurrent workers never receive the same candidate.
- Claim increments `attempt_count`.
- Retry delay and terminal discard work at the configured maximum.
- Rediscovery cannot reset processed or terminal candidates.
- Existing prospect domains do not reduce the requested unique batch if more rows remain.

### Database and security verification

- Create migration files through the Supabase CLI rather than inventing filenames.
- Regenerate TypeScript database types and remove new string-cast table workarounds.
- Enable RLS on new public-schema tables and revoke public Data API access for internal job tables.
- Restrict execution of privileged database functions; do not leave internal functions executable by
  `PUBLIC`.
- Run Supabase security and performance advisors after schema work.
- Verify migrations locally/on a branch and perform read-only production checks after deployment.

## Rollout

1. Deploy telemetry and accounting before increasing workload.
2. Canary cap/allocation changes on 2–3 representative products for at least two full UTC days,
   including both paid cron windows.
3. Compare quota attainment, candidate-to-ready conversion, cost, runtime, scraper failures, sequence
   failures, bounce rate, dismissals, and replies with the baseline.
4. Roll out existing-source fixes before enabling strategies from the related ticket so yield is
   attributable.
5. Re-evaluate the initial cap of 80 using the canary. Keep a hard ceiling even if it changes.

## Acceptance criteria

- Every eligible product uses adaptive discovery with target 25 unless deliberately configured
  otherwise.
- Each product has at most one active daily execution and one persisted daily summary.
- Multiple runs top up the same UTC-day target.
- The scheduler stops when persisted sequence-ready count reaches 25 or a persisted safety,
  exhaustion, or configuration reason prevents it.
- No email-not-found, failed-enrichment, sequence-less, duplicate-domain, directory, marketplace,
  manual, or disabled-type row counts toward 25.
- Every miss is attributable to source exhaustion, configuration, attempt cap, cost cap, transport
  failure, enrichment failure, or sequence failure.
- Existing-source changes do not regress bounce rate, dismissal rate, reply quality, scraper error
  rate, or daily discovery cost.

The long-term aspiration is every eligible product-day at 25, but the scheduler must not manufacture
weak prospects to make the counter green. When a legitimate market is exhausted, report the reason
and keep pricing/UX language at `~25` rather than turning it into an unconditional guarantee.

## Relevant files

- `apps/server/src/jobs/daily-backlink-discovery.ts`
- `apps/server/src/jobs/index.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/strategy-rotation.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/discovery-candidate-backlog.ts`
- `apps/server/src/methods/prospect-generation-methods/`
- `apps/server/src/processes/onboarding/prospect-sequences.ts`
- `apps/web/app/api/onboarding/complete/route.ts`
- `apps/web/app/api/link-building/discovery-settings/route.ts`
- `apps/web/lib/opportunity-types.ts`
- `apps/web/consts/billing.ts`
- `supabase/migrations/20260826181258_add_adaptive_discovery_settings.sql` (currently absent from the
  repository even though the production schema exists; recover/reconcile rather than recreating
  blindly)
- `supabase/migrations/20260827150900_enable_adaptive_discovery_for_active_users.sql` (tracked locally,
  but absent from production migration history when audited)
