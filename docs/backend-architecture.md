# Mentiohunt — Backend Architecture for Backlink Opportunity Discovery

## Context

Mentiohunt is a SaaS that finds backlink opportunities for users' products and surfaces them with LLM-drafted outreach emails. The web app already has an onboarding wizard collecting `websiteUrl`, `productDescription`, `competitors` (3–10), `opportunityTypes` (6 predefined), and `discoverySource`. There is no backend yet.

This document defines how the backend discovers, validates, scores, and serves backlink opportunities to each user's product on a daily cadence — without prescribing storage schemas.

Decisions captured from planning session:

- **Strategies day 1:** Broken link building, Unlinked brand Mentiohunt, Resource page / listicle insertion, Competitor backlink gaps. Registry must be expandable to HARO, guest posts, forums, podcasts.
- **Data source budget:** Mid tier — DataForSEO (SERP/backlinks), Hunter limited (email enrichment), Moz free (DA/spam).
- **Outreach:** Discovery + LLM-drafted templates. No sending pipeline.
- **Volume:** Tier-dependent (Free 10/d, Pro 50/d, Agency 200/d — exact numbers TBD).
- **Locale:** English only.
- **Topology:** Global opportunity pool, per-user scoring + enrichment.
- **Stack:** Node/TS in `apps/server` to match monorepo.
- **Scoring signals:** Topical relevance (semantic) + Domain authority + Spam score/blacklist.
- **Validation gates:** URL alive + indexable + English; Not previously contacted (per-user + global cooldown); Spam/NSFW/PBN filter.

---

## 1. Onboarding inputs (drives discovery quality)

Wizard already collects what's needed for v1 (`apps/web/components/onboarding/onboarding-wizard.tsx`). Recommended **post-onboarding enrichment** runs server-side (no extra UX cost) to bootstrap discovery:

| Source               | What we extract                                                                                    | How                         |
| -------------------- | -------------------------------------------------------------------------------------------------- | --------------------------- |
| `websiteUrl`         | Title, meta description, H1s, canonical, sitemap, top internal pages, primary lang                 | Fetch + parse + sitemap.xml |
| `productDescription` | Cleaned text → embedding (text-embedding-3-large or Voyage)                                        | OpenAI/Voyage               |
| `websiteUrl` content | LLM-derived: ICP, category, 5–15 seed keywords, content pillars                                    | One-shot LLM call (cached)  |
| `competitors[]`      | Same enrichment per competitor; backlink profile via DataForSEO Backlinks API                      | DataForSEO                  |
| Inferred excludes    | Competitors auto-blocked from outreach. Add user-controllable "Excluded domains" later in settings | —                           |

Future onboarding additions (defer until needed):

- "Paste existing backlinks" → seeds the contacted-set + winning-pattern training.
- Free-text "ICP" override (fallback to inferred).

---

## 2. Strategy registry (extensible)

Each `OpportunityType` from the wizard maps to one or more **Discoverers**. A Discoverer is a self-contained module: `(productProfile) → Promise<RawOpportunity[]>`. Adding a new strategy = drop a new discoverer + register it.

```
discoverers/
  brokenLink.ts          // OPPORTUNITY_TYPES: niche_blogs, resource_pages
  unlinkedMention.ts     // listicles, niche_blogs, competitor_Mentiohunt
  resourcePage.ts        // resource_pages, directories
  listicleGap.ts         // listicles, alternatives
  competitorBacklinkGap.ts // competitor_Mentiohunt, alternatives
  directorySubmission.ts // directories
  // future: haro.ts, guestPost.ts, forumThread.ts, podcastGuest.ts
```

### Mapping wizard `OPPORTUNITY_TYPES` → discoverers

| Wizard type             | Primary discoverer(s)                      | Core technique                                                                                 |
| ----------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| `directories`           | `directorySubmission`                      | Curated directory DB + SERP `intitle:"submit" OR "add your"` + niche keywords                  |
| `resource_pages`        | `resourcePage`, `brokenLink`               | SERP footprints `intitle:"resources" inurl:resources` + crawl outbound links + 404 check       |
| `listicles`             | `listicleGap`, `unlinkedMention`           | SERP `"best <keyword> tools" -site:<user>` + parse list items + check user/competitor presence |
| `alternatives`          | `listicleGap`, `competitorBacklinkGap`     | SERP `"<competitor> alternatives"` + check inclusion                                           |
| `competitor_Mentiohunt` | `unlinkedMention`, `competitorBacklinkGap` | Mention search for competitor names + DataForSEO competitor backlinks minus user backlinks     |
| `niche_blogs`           | `brokenLink`, `unlinkedMention`            | Topical SERP + crawl + outbound 404 + brand mention scan                                       |

### Discoverer interface (sketch)

```ts
interface Discoverer {
  id: string;                 // 'broken_link'
  appliesTo: OpportunityType[]; // ['niche_blogs', 'resource_pages']
  run(input: DiscoveryInput): AsyncIterable<RawOpportunity>;
}

interface RawOpportunity {
  url: string;             // page where link would live
  domain: string;
  rationale: 'broken_link' | 'unlinked_mention' | 'resource_gap' | 'listicle_gap' | 'competitor_gap' | 'directory';
  evidence: Record<string, unknown>; // dead anchor URL, mention snippet, competitor URL, etc.
  sourceQuery?: string;    // for traceability
  discoveredAt: Date;
}
```

---

## 3. Daily process pipeline

Topology: **global crawl/discovery → global pool → per-user scoring + enrichment**. Crawling is the expensive part; share it. Scoring + email enrichment is cheap to run per-user on the shortlist.

### Stage diagram

```
[Cron 03:00 UTC]
   ↓
1. SeedPlanner          (per active product)  → list of (discovererId, query/seed) jobs
   ↓
2. DiscoveryWorkers     (global, deduped on URL)
   ├── SERP queries (DataForSEO)
   ├── Page fetch + parse (undici + cheerio; Playwright fallback for JS-heavy)
   └── Outbound link check (broken-link strategy)
   ↓ writes to global RawOpportunity pool
3. NormalizeAndDedupe   (canonicalize URL, strip UTM, hash, lang-detect, drop non-EN)
   ↓
4. ValidationGates      (run once globally)
   ├── HTTP 200 + non-noindex (HEAD then GET)
   ├── English (cld3 / fasttext-lid)
   └── PBN/NSFW classifier (heuristic + LLM batch on borderline)
   ↓ pool of validated opportunities (TTL: 30d, then re-validate)
5. PerUserMatch         (one job per active product)
   ├── Vector similarity: opportunity page embedding ↔ product profile embedding (top-K, e.g. 500)
   ├── Cooldown filter: drop if globally contacted < 90d OR user contacted ever OR competitor domain
   └── Quota cap: keep top N by composite score where N = tier limit
   ↓
6. ScoringPass          (composite per surviving candidate)
   ├── Relevance (cosine sim, 0-1)
   ├── Authority (Moz DA via API → 0-1)
   ├── Spam penalty (Moz spam score + blacklist)
   └── Recency / freshness bonus
   ↓
7. EnrichmentPass       (only on top N to save cost)
   ├── Author / contact discovery: page byline + about/contact pages
   ├── Hunter email finder (limited; cache by domain 30d)
   ├── MX + SMTP probe (verify deliverability without sending)
   └── LLM draft template (model: claude-haiku-4-5; prompt = product + opp evidence + tone)
   ↓
8. Publish              (mark visible to user; emit notification)
```

### Concurrency / queueing

- **BullMQ + Redis** (Node-native, monorepo-friendly).
- Queues: `discover`, `validate`, `match`, `score`, `enrich`, `notify`.
- Per-domain rate-limit on `discover` (1 rps / domain) using BullMQ groups.
- Outbound HTTP via shared fetch client with politeness (User-Agent identifies tool, respects robots.txt, respects `Crawl-Delay`).
- Failure policy: exponential backoff, max 3 retries, dead-letter queue for manual triage.

### Scheduling

- Single global cron at off-peak (03:00 UTC). Stagger per-user `match` + `enrichment` over the next 6h to spread API spend and avoid spikes.
- Each product re-runs at most once / 24h; manual "refresh now" button rate-limited per tier.

---

## 4. Data sources & costs

| Provider                       | Use                                           | Cost shape                                   | Cache TTL                              |
| ------------------------------ | --------------------------------------------- | -------------------------------------------- | -------------------------------------- |
| **DataForSEO SERP**            | Footprint queries, competitor SERPs           | ~$0.0006/query (live), batch even cheaper    | 7d per (query, locale)                 |
| **DataForSEO Backlinks**       | Competitor backlink profiles for gap analysis | ~$0.02/domain                                | 30d/domain                             |
| **Moz Links API (free tier)**  | DA + spam score                               | 25k rows/mo free                             | 30d/domain                             |
| **Hunter.io (limited)**        | Email finder + verifier                       | 25–500 free, then ~$0.04/lookup              | 30d/domain (email + role + confidence) |
| **OpenAI / Voyage embeddings** | Product + page embeddings                     | ~$0.00013/1k tokens (text-embedding-3-large) | Embed once per content hash            |
| **Anthropic Claude Haiku 4.5** | LLM draft templates, borderline classifier    | Cheap per draft; only top-N                  | n/a                                    |
| **Self-hosted fetcher**        | Page fetch + light parse                      | Compute only                                 | —                                      |
| **Browserless / Playwright**   | JS-heavy fallback (~5% of pages)              | Compute or per-session                       | —                                      |

Cost guard: per-user **daily credit budget** (function of tier). Each pipeline stage decrements credits. When near zero, drop to free-only paths and skip enrichment past tier quota.

---

## 5. Validation gates (every opportunity must pass)

Run **once globally** before entering the validated pool — saves repeat work across users.

1. **URL alive + indexable + EN**
   - HEAD; on 200 GET. Reject 4xx/5xx, soft-404, login walls, paywalls (text-density heuristic).
   - Reject `<meta name="robots" content="noindex">` or `X-Robots-Tag: noindex`.
   - Reject `nofollow`-default contexts (UGC pages, comment sections).
   - Language: `cld3` on extracted text; reject if not English.

2. **Spam / NSFW / PBN filter**
   - Hard: Moz spam score > 30, manual blacklist, known PBN signatures (shared C-class IP across many low-DA sites, identical templates).
   - Soft: NSFW classifier on title + meta + first 2k chars (LLM batch on uncertain cases).

3. **Per-user contact dedupe**
   - Drop if **same user** ever contacted this domain (manual override possible).
   - Drop if **any user** contacted same domain within 90d (global cooldown protects sender reputation across the platform).
   - Drop if domain is the user's own site or any competitor.

4. **Email deliverability** (during enrichment, not gating)
   - Hunter confidence ≥ 70 OR pattern-guessed + MX + SMTP probe (no actual send) returning RCPT-OK.
   - Flag catch-all domains; lower their email score, keep opportunity surfaced.

---

## 6. Scoring model

Composite score in [0, 1]. Tunable weights via config; start with:

```
score = 0.45 * relevance
      + 0.30 * authority
      + 0.15 * spam_inverse        // 1 - normalized spam score
      + 0.10 * freshness            // page modified < 365d boost
```

- **relevance** = cosine(productEmbedding, pageEmbedding). Compute page embedding from `<title> + <h1> + first 2k chars + meta`.
- **authority** = `min(1, Moz_DA / 80)` — DA 80+ caps at 1.
- **spam_inverse** = `1 - clamp(Moz_spam_score / 17, 0, 1)`.
- **freshness** = exponential decay on `lastModified` (sitemap + `Last-Modified` + visible date).

Per-user adjustments:

- Boost if domain has linked to a user-supplied "winning backlink" pattern (future).
- Penalty if domain language ≠ EN even though page passed (mixed-lang sites).

Strategy-specific bumps applied in `ScoringPass`:

- **Broken link**: +0.05 if dead link's anchor text semantically matches product.
- **Unlinked mention**: +0.10 if mention is exact brand match in body, not footer/sidebar.
- **Listicle gap**: +0.10 if user is a clear semantic fit for list theme (sim ≥ 0.75).

---

## 7. Email / contact discovery

Order of operations (stop at first success):

1. Hunter.io domain search → role-based or author email; capture confidence.
2. Page-level: parse byline → match against Hunter author list → guess pattern (`first.last`, `first`, `firstinitiallast`) → MX + SMTP probe.
3. About / Contact / Team pages crawled once per domain → extract emails (regex + obfuscation decoder).
4. Generic fallback: `editor@`, `hello@`, `info@` → only if MX-OK and tier allows generic.

Cache email findings by `(domain, person)` for 30d; refresh on bounce signal (future, when sending is in scope).

---

## 8. LLM-drafted outreach templates

- Per opportunity, generate **subject + 80–120 word body** using Claude Haiku 4.5.
- Inputs: product description, opportunity type, evidence snippet (broken link anchor, mention sentence, listicle title), recipient name (if known), domain tone (inferred: formal/casual).
- Constraints in system prompt: no fabricated stats, no false familiarity, mention specific page reference, single CTA, plain text.
- Cache by `(productId, opportunityId)`; regenerate only if user clicks "regenerate".
- Show editable in UI; track edits to fine-tune prompt over time.

---

## 9. Outreach state per user

Track per `(userId, domain)`:

- `firstContactedAt`, `lastContactedAt`, `replyState` (no_reply | replied | bounced | unsubscribed), `manualOverride`.

Used by validation gate #3 and future sending pipeline. Surfaces to UI as "already contacted" badge.

---

## 10. Tier-based quotas (placeholder numbers)

| Tier   | Daily opps surfaced | Hunter lookups / day | LLM drafts / day | Manual refresh / day |
| ------ | ------------------- | -------------------- | ---------------- | -------------------- |
| Free   | 10                  | 5                    | 10               | 1                    |
| Pro    | 50                  | 50                   | 50               | 5                    |
| Agency | 200                 | 200                  | 200              | unlimited            |

Quotas enforced at credit level (one credit ≈ one validated + scored + enriched opportunity). Surplus discoveries spill to "next day" pool, expiring after 7d.

---

## 11. Stack

- **Runtime:** Node 20 + TypeScript (`apps/server`). Framework: Hono or Fastify (lightweight; Hono fits monorepo + Bun/Node flexibility).
- **Queues:** BullMQ + Redis.
- **DB:** Postgres (Neon / Supabase) — schema design out of scope here, but key tables: `products`, `opportunities` (global), `product_opportunities` (per-user with score + status), `domain_contacts`, `outreach_log`.
- **Vector store:** pgvector extension on Postgres (avoid extra service). Embeddings cached on `pages` table.
- **Crawling:** `undici` + `cheerio`. Playwright via `browserless.io` for the ~5% of pages needing JS.
- **Cron:** `pg-boss` or BullMQ repeatable jobs. Single scheduler pod.
- **Embeddings:** OpenAI `text-embedding-3-large` or Voyage `voyage-3-large` (better for long text + cheaper).
- **LLM drafts:** Anthropic Claude Haiku 4.5 (`claude-haiku-4-5`).
- **Observability:** PostHog for product events, Sentry for errors, structured logs with per-job correlation IDs.

---

## 12. Critical files to create (when implementation begins)

```
apps/server/
  src/
    config/                     # provider keys, tier quotas, weights
    lib/
      fetch.ts                  # polite fetch (UA, robots.txt, rate-limit)
      embeddings.ts             # OpenAI/Voyage wrapper + cache
      moz.ts                    # DA + spam
      dataforseo.ts             # SERP + backlinks
      hunter.ts                 # email + verify
      smtp-probe.ts             # MX + RCPT
      lang.ts                   # cld3 wrapper
      classifier-spam.ts        # heuristic + LLM borderline
    discoverers/                # one file per strategy (see §2)
    pipeline/
      seedPlanner.ts
      normalize.ts
      validate.ts
      match.ts
      score.ts
      enrich.ts
      publish.ts
    queues/
      index.ts                  # BullMQ setup
      workers/                  # one per stage
    scheduler.ts                # cron + per-product scheduling
    api/                        # opportunity CRUD for web app
```

---

## 13. Verification plan

End-to-end smoke test pre-launch:

1. Seed one test product with known niche (e.g. our own site as the "user product").
2. Run pipeline manually: `pnpm --filter server pipeline:run --productId=<id>`.
3. Assert: ≥ 10 candidates pass validation; ≥ 1 per active strategy; relevance scores spread (not all 0.99); spam/blacklist gate filtered ≥ 1 known-bad domain (seed a fixture).
4. Email enrichment hits cache on 2nd run (assert no duplicate Hunter calls).
5. LLM draft renders, references opportunity-specific evidence (regex or LLM-judge eval).
6. Re-run next day → cooldown filter excludes domains already in `outreach_log`.

Per-component:

- Unit tests for each Discoverer with recorded HTTP fixtures (msw or nock).
- Contract tests for provider wrappers (mocked + a small live smoke run gated on `RUN_LIVE=1`).
- Load test the queue with 100 synthetic products to confirm rate-limit + budget caps.

Production health checks:

- Daily success rate per stage in dashboard.
- p95 stage latency.
- Per-provider spend tracked vs tier-quota envelope.
- Bounce / spam-reported rate (when sending lands later) to retroactively tune scoring.

---

## 14. Open questions to revisit before code

1. Exact tier quotas + pricing — needs a sales/finance call.
2. Should manual "Excluded domains" + "Past wins" be in v1 settings UI or deferred?
3. Refresh-now button behavior: trigger only `match + enrich` or full discovery?
4. Compliance: do we honor robots.txt strictly, or only for crawl-then-store (industry varies)?
5. When a user adds a competitor mid-cycle, retroactively re-score the global pool or wait for next daily run?
