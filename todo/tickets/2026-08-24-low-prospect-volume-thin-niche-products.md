# Investigate low prospect volume for thin-niche products (RecordFlow case)

**Status: Investigated and first discovery fixes implemented 2026-08-24 — fix current discovery before adding strategies**

## Background

Adam (`dobrawy.adam@gmail.com`, product **RecordFlow** — `https://recordflow.org`,
signed up 2026-08-14) emailed 2026-08-24: "I do not see many prospects."

RecordFlow auto-backs up Zoom cloud recordings to cloud storage on
completion, with optional auto-delete from Zoom to free up storage. Niche
B2B utility, narrow category.

Initial account check:

- 17 discovery runs since signup (10 days), including the onboarding burst
  and subsequent scheduled runs across all 5 strategies
  (`competitor_backlink`, `unlinked_mention`, `listicle_roundup`,
  `resource_page_inclusion`, `broken_link_building`). All were recorded as
  `completed`, with $0.29 total spend (`backlink_prospect_runs`, product_id
  `1bf02737-1c8f-4e46-b443-b5b9166e3f0d`).
- Result: **10 prospects total** (4 bounced, 2 contacted, 4 new). Most
  individual runs return 0 — only `competitor_backlink`, `listicle_roundup`,
  and `resource_page_inclusion` ever produced anything.
- Settings are not the bottleneck: DR range 5–60 (not restrictive), all 5
  opportunity types enabled in `backlink_prospects_settings`.
- Competitors (`products.competitors` for this row): `recordmover.com`,
  `zbackup.app`, `splain.io`, `teleport-app.com`,
  `publishflow.intersomos.com.br`, plus the Zoom marketplace listing itself.
  These are themselves tiny/unknown tools — thin backlink profiles to mine
  against.

The main constraint looks structural: "Zoom recording backup" is a
small category — few real competitors, few listicles/roundups covering it,
few sites likely to unlinked-mention a brand-new small product. The 5
rotated discovery strategies
(`apps/server/src/jobs/daily-backlink-discovery.ts`, `ROTATION_STRATEGIES`)
all lean on the product already having outside visibility (competitor
backlinks to mine, existing mentions, existing listicles to appear in).
Thin-niche, pre-visibility products have none of that yet, so these
strategies structurally starve regardless of DR/settings tuning.

## Investigation findings

### Recommendation

**Fix the current discovery system first; then add `guest_post_pitch`.**
Adding strategies before fixing selection would give productive strategies
less calendar time while exhausted and failing strategies continue consuming
equal daily slots.

Priority:

1. Reject or remove marketplace/platform competitor targets and clean up
   false-positive prospects created from them.
2. Make rotation yield-aware: cool down strategies after repeated genuine
   zero-result runs instead of selecting only by least-recently-run.
3. Distinguish scraper/transport failure from a genuine zero-result run.
4. Once those are in place, add `guest_post_pitch` as the first new recurring
   visibility-independent strategy.

Do **not** add a special "thin niche" code path yet. Use observed strategy
yield and run health for every account instead; competitor count is not a
reliable classifier.

### How common is it?

Snapshot on 2026-08-24:

- 15 active discovery-eligible products; only 6 were at least 7 days old.
- With a strict RecordFlow-like definition (age >= 7 days, <= 6 competitors,
  <= 10 prospects), RecordFlow was the only match: 1/6 mature products.
- Lowish early volume is broader: 3/6 mature products had only 10–13
  prospects.
- Competitor count did not predict volume. One mature product with 3
  competitors had 176 prospects, while another with 9 had only 13.

Across 261 runs belonging to currently active products:

| Strategy | Zero-result runs | Prospects/run |
|---|---:|---:|
| `unlinked_mention` | 55/64 (86%) | 0.20 |
| `listicle_roundup` | 35/59 (59%) | 1.59 |
| `broken_link_building` | 14/27 (52%) | 0.70 |
| `resource_page_inclusion` | 22/45 (49%) | 1.22 |
| `competitor_backlink` | 12/66 (18%) | 8.29 |

`selectStrategyForRun` currently reads only `strategy` and `started_at`, so
all runnable strategies get equal turns regardless of recent yield.

### RecordFlow-specific corrections

- 13 of its 17 runs returned zero.
- The 10 stored prospects overstate useful volume. Four `new` prospects all
  came from mining backlinks to `marketplace.zoom.us` and are unrelated Zoom
  ecosystem sites. Only 6 prospects came from plausible sources.
- `publishflow.intersomos.com.br` is a real direct competitor, not a mismatch:
  it automatically publishes completed Zoom cloud recordings to YouTube and
  advertises more storage destinations. Keep it.
- The bad competitor entry is the Zoom Marketplace app URL. Downstream
  normalization drops its path and mines the entire `marketplace.zoom.us`
  hostname, which produced all four false positives.
- The 2026-08-23 listicle run gathered 67 candidates, attempted 25 fetches,
  and timed out on all 25, yet was marked `completed`. Completed status alone
  therefore does not mean discovery ran cleanly.
- `unlinked_mention` has a similar observability gap: transport failures
  return `null` and are aggregated with genuine non-matches.

### Strategy sequencing for this problem

1. **`guest_post_pitch`** — first new recurring strategy. Visibility-independent,
   but not merely a rotation registration: the existing free-tool method still
   needs qualification, query rotation, persistence/enrichment, outreach
   framing, run tracking, alerting, and UI/enum plumbing.
2. **Shared persist/enrich extraction**, before adding another recurring
   strategy.
3. **`integration_ecosystem`** — best next fit for thin-niche SaaS. RecordFlow's
   crawled pages provide strong Zoom, Google Drive, OneDrive, Dropbox, and
   YouTube signals even though its backlink footprint is small.
4. **`directory_gap`** — useful, but should be an onboarding/monthly
   `action_required` task rather than a daily outreach rotation slot.
5. **`testimonial_exchange`** — event-driven and only after collecting a
   customer-confirmed vendor list.
6. **`competitor_alternatives_page`** — lower priority for this problem because
   obscure competitors may have equally empty branded SERPs.

### Competitor-quality follow-up

A focused follow-up ticket is warranted:

- The generator forces 8–10 competitors, which encourages padding in small
  categories.
- Validation checks DNS existence, not semantic relevance or whether the
  value is a host rather than a path-level marketplace/listing URL.
- 2 of 122 active competitor entries contained paths. One—the RecordFlow Zoom
  Marketplace entry—generated four false prospects.
- A 2026-08-17 prompt change now asks the model to exclude marketplaces, so
  recurrence risk is lower, but there is still no hard validation or
  discovery-time platform blocklist.

RecordFlow cleanup to perform with that fix: remove the Zoom Marketplace
competitor entry and dismiss its four false-positive `new` prospects. Do not
remove PublishFlow.

## Objective

Figure out how to get more opportunities for this class of product (small
niche, low pre-existing web visibility) — not just RecordFlow specifically.
Investigation, not a committed build:

1. Quantify how common this is — how many active products fall into "few
   competitors + low prospect count after N days" the way RecordFlow does.
   If it's rare, this may not be worth new strategy investment; if it's a
   meaningful chunk of the customer base, it is.
2. Look at `todo/tickets/prospect-outreach-strategies/` — an existing,
   unactioned proposal set for exactly this gap. Several of the proposed
   strategies don't depend on the product already having competitor
   backlinks or existing mentions to find, which is the specific failure
   mode here:
   - `01-guest-post-pitch.md` — already-built (`methods/guest-post-sites/`)
     but never wired into rotation; doesn't need existing visibility.
   - `11-directory-gap-submission.md` — already-built
     (`methods/directories/`), same story.
   - `08-integration-ecosystem.md` / `09-testimonial-exchange.md` — sourced
     from the product's own `product_pages`, not from competitor/mention
     data, so should work even for a product with near-zero backlink
     footprint.
   - `03-competitor-alternatives-page.md` — SERP + `competitors`, worth
     checking if it holds up when competitors are themselves obscure (may
     have the same starvation problem RecordFlow already shows).
   Per that folder's README, `01 → 02 → 03` was the suggested build order,
   then the shared-groundwork extraction before going further — re-evaluate
   that sequencing specifically against "which of these unblock thin-niche
   products" rather than raw effort/value alone.
3. Decide whether thin-niche accounts need a distinct code path (e.g.
   auto-detect low competitor/mention density and shift strategy mix toward
   the visibility-independent ones) or whether wiring in 01/11 into the
   default rotation is enough on its own.
4. Separately, low-effort fix regardless of the above: audit
   `publishflow.intersomos.com.br` in RecordFlow's competitor list and any
   other accounts with obviously mismatched auto-detected competitors —
   check whether competitor detection has a systemic quality issue worth
   its own ticket.

## Implementation status

The first two corrective slices are now implemented:

1. **Yield-aware rotation and run health**
   - New runs record `healthy`, `partial`, or `failed` health in metadata.
   - SERP, scraper, and fetch transport failures are tracked separately from
     genuine zero-yield runs.
   - Two consecutive clean zero-yield runs cool down a strategy for one product
     slot; four or more cool it down for three slots. Partial and failed runs
     remain eligible for normal retry.

2. **Competitor quality safeguards**
   - Onboarding and dashboard writes canonicalize competitors to HTTPS root
     domains, reject deep links and known marketplaces/directories/review
     platforms, require resolving DNS, and allow 2–5 high-confidence generated
     suggestions instead of forcing 8–10.
   - Discovery also ignores blocked legacy competitor entries, so the Zoom
     Marketplace URL cannot consume backlink, broken-link, or listicle budget.

Still pending:

- One-time production cleanup of RecordFlow's Zoom Marketplace entry and the
  AnimeTrivia Sporcle entry, including any prospect rows they created.
- Semantic competitor validation beyond DNS/blocklists.
- `guest_post_pitch`, then `integration_ecosystem`.
- A periodic/action-required `directory_gap` workflow rather than a daily
  rotation slot.
