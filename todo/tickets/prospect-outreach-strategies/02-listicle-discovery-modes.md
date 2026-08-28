# 02 — Specialized listicle discovery modes

- **Status:** Proposed — not started
- **Priority:** P1
- **Depends on:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md`
- **Adds enum value:** No. This expands the existing `listicle_roundup` engine with an internal `mode`
  discriminator. No migration, no `apps/web/lib/opportunity-types.ts` change.

## Why this one

Recent listicle runs gathered ~11,021 candidates but fetched only ~978 and produced ~69 ready rows —
the query pool and backlog infrastructure exist, but coverage is shallow and the scorer actively
throws away opportunities that a specific pitch could win. Two gaps:

- **Competitor-alternatives coverage is one query shape.** `build-listicle-queries.ts:144-151` emits
  exactly `"Brand" alternatives` per competitor — no `vs`, no `competitors`, no `alternatives to`, no
  category-qualified variant.
- **Stale listicles are only ever penalized.** `score-listicle-relevance.ts:46-63` caps an
  "unclear if maintained" page at 3 and an "abandoned/outdated" page at 2 — below the
  `MIN_RELEVANCE_SCORE = 3` cutoff — even when a concrete "your list is out of date, here's what
  changed" pitch is valid. The scorer never even sees a date.

## What exists today

- **Query templates:** `listicle-roundup/build-listicle-queries.ts:132-138` — exactly three per
  category: `best {cat} -site:{own}`, `top {cat} -site:{own}`, `best {cat} after:{today-90d}
  -site:{own}`. `MAX_CATEGORIES = 5`, `FRESHNESS_WINDOW_DAYS = 90` (`:10-11`). Categories come from
  `product.target_keywords` verbatim when present, else one cheap LLM call.
- **Competitor-alternative branch:** `build-listicle-queries.ts:144-151` — per competitor,
  `brandNameFromDomain` (`:48-55`) → `"${brandName}" alternatives -site:${own}`, weight 1. Single
  shape only.
- **Query rotation:** `listicle-roundup/prospect-run-tracking.ts:13-47` `selectQueriesForRun` —
  least-recently-run first (never-run queries sort to the front), keyword weight as tiebreak,
  `MAX_QUERIES_PER_RUN = 6` (`index.ts:34`). Selected queries persist into
  `backlink_prospect_runs.input.queries`, which closes the rotation loop (`prospect-run-tracking.ts:52-57`).
- **Scoring:** `listicle-roundup/score-listicle-relevance.ts:46-63` — prompt asks "genuine, updatable
  listicle of tools in this product's exact category, where THIS product is not already listed".
  Returns `{ id, score, reason, topCompetitor }` (schema `:65-92`). `BATCH_SIZE = 10`. Freshness
  enters only as the two negative caps above. `fetchPageContent` returns `{ url, title, description,
  text }` only (`check-listicle-client.ts:6-11`) — no date extraction.
- **Persistence:** `listicle-roundup/index.ts:326-348` builds a bare row
  (`tier: "listicle_roundup"`, no per-candidate metadata) and calls `persistAndEnrich`. There is no
  `mode`/`variant` column on `backlink_prospects`; the only per-prospect free-form slot is
  `raw_metadata.outreach_context`, written in `listicle-roundup/enrichment.ts:70-73`.
- **Outreach framing:** `shared/generate-outreach-sequence.ts` — `listicle_roundup` has **no dedicated
  `OutreachContext` variant**; it shares the `competitor_backlink` variant (`:13-24`) and falls
  through to the generic branch (`:182-190`). `enrichment.ts:51-58` hardcodes `pageType: "roundup"`,
  `anchor: ""`, `competitorNamedInText: true`, so every listicle email renders
  `Anchor text used for competitor: (unknown)` and a generic "pitch adding this product alongside
  {competitor}" angle (`buildAngle` `"roundup"` case, `:117-118`).

## Implementation

1. **Introduce a `mode` discriminator** carried from query construction through scoring, persistence
   (`raw_metadata`), and framing:
   - `current_category_listicle` — today's behavior, the control group.
   - `competitor_alternatives`.
   - `stale_refresh`.
2. **`competitor_alternatives` query expansion** — per competitor, rotate:
   `"Brand" alternatives`, `best "Brand" alternatives`, `"Brand" vs`, `"Brand" competitors`,
   `{category} alternatives to "Brand"`. Tag each with `mode: "competitor_alternatives"`.
   Qualification must require the competitor to appear on the page **and** the customer's product to
   be absent (reuse `brand-mention.ts` `competitorNamedInVisibleText` for the first check).
3. **`stale_refresh`** — accept genuine listicles that are visibly stale but still reachable:
   - Require **concrete, non-invented staleness evidence**: a year in the title/URL/visible body that
     is at least one year old, or named tools in the list that are dead / renamed / acquired. Return
     the evidence string on the scored candidate.
   - Require a host that still responds (the fetch already proves reachability; also reject obvious
     parked/expired domains).
   - Feed the page's visible date / "last updated" line into the scorer input. Never synthesize one if
     absent.
   - Raise the score for a stale-but-fixable page instead of capping it.
4. **Return in one scoring pass** (extend the `score-listicle-relevance.ts` schema): `mode`,
   `evidence`, `namedProducts`, `productPresent` (bool), and a mode-specific fit score. Persist `mode`
   + `evidence` into `raw_metadata.outreach_context` so outreach framing is specific.
5. **Mode-aware rotation** — tag the pooled queries with their mode and make `selectQueriesForRun`
   fill the 6 slots across modes (e.g. round-robin by mode, then least-recently-run within mode) so
   one mode cannot monopolize a run.
6. **Real framing** — add a `listicle_roundup` variant to `OutreachContext` carrying `mode`, `title`,
   `foundUrl`, `evidence`, `namedProducts`, and add a `buildFraming` branch keyed on `mode`:
   - `current_category_listicle` → today's "belongs alongside X" angle, minus the bogus anchor line.
   - `competitor_alternatives` → "you list {competitor} as an option here — {product} is a direct
     alternative worth including".
   - `stale_refresh` → lead with the specific outdated detail ({evidence}), then offer {product} as
     part of the refresh.

## Safety constraints

- `stale_refresh` must never claim a page is outdated without the concrete evidence string; a page
  with no evidence is rejected, not guessed.
- `competitor_alternatives` must reject any page where the customer's product is already listed.
- Do not increase generic or misleading pitches: a `current_category_listicle` candidate that would
  have scored below cutoff before still scores below cutoff.
- All modes stay under the shared daily target / attempt cap / cost cap via the stop controller.

## Evaluation / success signal

Turn already-paid SERP and backlog inventory into incremental high-intent opportunities without
raising the rate of generic pitches. Track per mode: candidates gathered/fetched/qualified/attempted,
new unique domains after dedupe, ready conversion, reply and positive-reply rate after an observation
window. Keep a mode only if it adds unique send-ready domains and its replies are at least as good as
`current_category_listicle`.

## Tests

- Each mode emits its own qualification metadata (`mode`, `evidence`, `productPresent`) on the scored
  candidate and in `raw_metadata`.
- `stale_refresh` rejects a candidate with no concrete staleness evidence.
- `competitor_alternatives` rejects a page where the customer's product already appears.
- `competitor_alternatives` rejects a page where the competitor is not mentioned.
- Mode-aware `selectQueriesForRun` returns queries from more than one mode when multiple modes have
  runnable queries; no single mode takes all 6 slots two runs in a row.
- `buildFraming` produces a distinct situation/opening/ask per mode, and no listicle email contains
  `Anchor text used for competitor: (unknown)`.
- Cross-strategy duplicate domains (e.g. a domain already found by competitor discovery) do not count
  as incremental output.

## Relevant files

- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/build-listicle-queries.ts`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/prospect-run-tracking.ts`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/score-listicle-relevance.ts`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/check-listicle-client.ts`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/enrichment.ts`
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/index.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/brand-mention.ts`
