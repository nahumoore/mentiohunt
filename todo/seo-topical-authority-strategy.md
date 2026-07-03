# SEO Content to Build — Backlink Prospecting for SaaS Founders

Topic to own: **backlink prospecting / opportunity discovery for B2B SaaS founders.** Keyword data: DataForSEO, US/en, June 2026. Validated against GSC export 2026-07-02 (site is young — ~24 clicks total — so GSC positions/impressions are read as demand signals, not traffic).

Note on slugs: article MDX lives in `apps/web/resources/articles/` but serves at `/blog/<slug>`. GSC URLs use `/blog/`.

## GSC validation summary (2026-07-02)

- ✅ Head terms confirmed unwinnable: `find backlink opportunities` (129 impr, pos 59), `discover backlinks` (125 impr, pos 58) — impressions, zero clicks. Keep avoiding as primaries.
- ✅ BOFU cluster confirmed: `respona-vs-pitchbox` pos 8.2 with a click; BacklinkGPT alternative 14.3% CTR at pos 10.4; Respona alternative pos 18.7. Keep building compare/listicle content.
- ✅ Pillar live at `/blog/saas-backlink-building`, pos 14.9 on 8 impr — early but healthy.
- ⚠️ Biggest miss in v1 of this doc: `backlinks-from/*` is the site's strongest cluster (Forbes 4 clicks pos 9.2, Medium 2 clicks pos 8.1, Reddit 2 clicks pos 16.6, Pinterest 233 impr pos ~25, Quora 75 impr pos 18.8). Now a first-class workstream below.
- ⚠️ `how-to-find-backlink-opportunities` is the highest-impression page (412) but stuck at pos 49.6 — it has an authority problem, not a coverage problem. Fix = internal links + sharpening, not more keyword merging.
- ⚠️ `resource-page-link-building` is at pos 20 with 150 impr — striking distance. Do NOT consolidate it away (v1 said to merge it; reversed).

## Priority order

1. **Second pillar** (agency-vs-software) + **tools listicle** — as planned.
2. **New entries:** AI-citations article, Pitchbox pricing content.
3. **Housekeeping:** remove/redirect monitoring-era pages, tighten `/alternatives` hub.

---

## Pillar page — LIVE

**Slug:** `/blog/saas-backlink-building` (`articles/saas-backlink-building.mdx`)
**Title:** _Backlink Building for B2B SaaS Founders: An Opportunity-First Playbook_
**Primary:** `saas link building` (320/mo, low KD) · `link building for saas` (110/mo, low KD)
**Role:** comprehensive hub. Links down to every supporting article + existing clusters (`backlinks-from/`, `alternatives/`, `compare/`, `free-tools/`); each links back up.
**Status:** live, pos 14.9 (GSC). Next: ensure every cluster page links up to it; add `saas link building strategy` coverage here (merged per v1 decision — still correct).

## Supporting articles

### Tier 1 — DONE

| Slug                                    | Primary keyword              | Vol | KD  | GSC status                                     |
| --------------------------------------- | ---------------------------- | --- | --- | ---------------------------------------------- |
| `articles/link-building-outreach-email` | email outreach link building | 50  | 3   | Live, 24 impr, pos 20.7 — needs internal links |

Also covers `link building outreach` per tier 2 merge instruction.

### Tier 2 — DONE (consolidated, with one reversal)

- `link building outreach` → covered in `articles/link-building-outreach-email`. ✓
- `backlink opportunities` → `articles/how-to-find-backlink-opportunities`. ✓ Query sits at pos 25.5 (57 impr) — supports prioritizing this page's authority push now.
- `competitor backlink gap`, `broken link building` → sections in `articles/how-to-find-backlink-opportunities`. ✓
- **REVERSED:** `resource page link building` stays a standalone article. `/blog/resource-page-link-building` ranks pos 20 with 150 impr and draws its own queries (`what is resource page link building`, `resource page link building company`). Strengthen it instead: expand examples, add internal links from pillar + backlinks-from pages.
- `unlinked brand mentions` — standalone article exists but weak (127 impr, pos 67; SERP polluted by `ahrefs unlinked mentions`-type branded queries). Fair consolidation candidate: if it hasn't improved by next review, fold into `how-to-find-backlink-opportunities` and 301.

### Tier 3 — DONE (built; doc previously said "verify first")

| Slug                              | Primary keyword                  | Status                                                                            |
| --------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `articles/guest-posting-for-saas` | (guest post prospecting)         | Live. No GSC impressions yet — too new.                                           |
| `articles/haro-link-building`     | `haro link building` (210, KD18) | Live. No GSC impressions yet. One related query seen: `qwoted ai source request`. |

HARO keyword verification retained: secondary `haro backlinks` (210, KD19) + `digital pr` (720, KD23). Alternatives-comparison section (Connectively, Qwoted, SourceBottle, Terkel, Help a B2B Writer) — low KD, real intent. Pitch-template section using `media pitch template` (260, +333% trend). Skip `haro` bare / `qwoted` as primaries — brand-dominated SERPs.

## Avoid as primary (new-domain unwinnable — GSC-confirmed)

`link building`, `find backlink opportunities` (KD 64, GSC pos 59), `discover backlinks` (GSC pos 58) — head terms dominated by Ahrefs/Semrush/Backlinko. Also all `* index checker` terms (see housekeeping).

---

# Workstream: `backlinks-from/*` cluster (NEW — strongest performer)

The "how to get backlinks from X" pattern has proven demand and Mentiohunt already ranks. GSC 2026-07-02:

| Page                       | Clicks | Impr | Pos  | Action                                                                                                                                                                                                                                           |
| -------------------------- | ------ | ---- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `backlinks-from/forbes`    | 4      | 101  | 9.2  | Best performer. Queries incl. `buy forbes backlink` (careful: answer the intent, never promise/sell placements). Keep fresh.                                                                                                                     |
| `backlinks-from/pinterest` | 0      | 233  | 24.9 | **Biggest single traffic win available.** ~150+ combined impr across query variants (`pinterest backlinks`, `pinterest dofollow backlinks`, `how to get backlinks from pinterest` pos 9.9). Refresh: nofollow reality, dofollow paths, examples. |
| `backlinks-from/quora`     | 0      | 75   | 18.8 | Refresh for page 1.                                                                                                                                                                                                                              |
| `backlinks-from/reddit`    | 2      | 72   | 16.6 | Refresh for page 1.                                                                                                                                                                                                                              |
| `backlinks-from/medium`    | 2      | 50   | 8.1  | Already page 1 — keep fresh.                                                                                                                                                                                                                     |
| `backlinks-from/wikipedia` | 0      | 51   | 40.2 | Refresh; queries incl. `are wikipedia links nofollow`.                                                                                                                                                                                           |
| `backlinks-from/chatgpt`   | 1      | 11   | 48.7 | Feeds the AI-citations article below; interlink.                                                                                                                                                                                                 |

**New platform pages** (proven template — verify vol/KD per platform before building): GitHub, Substack, Product Hunt, G2/Capterra, Crunchbase, podcasts, newsletters. Prioritize by DataForSEO check; the pattern itself is validated.

Every `backlinks-from/*` page must link up to the pillar and across to `how-to-find-backlink-opportunities` (this is part of fixing that page's pos-49 problem).

---

# Expansion (AI-resistant: data, judgment, buyer intent)

## Second pillar — the buying decision

**Slug:** `/blog/saas-link-building-agency-vs-software`
**Title:** _Agency vs Software vs Managed: How SaaS Founders Should Actually Buy Link Building_
**Primary:** `saas link building agency` (590, low KD) · `outreach link building services` (70, KD9) · `link building for saas` (110, supporting only — primary belongs to main pillar)
**Role:** decision pillar with POV (more transparent than agency, less work than software). Feeds `alternatives/*` + `compare/*` clusters. AI-resistant = needs judgment.
**Status:** not built. Still the right call — no GSC contradiction.

## NEW: Backlinks and AI search citations

**Slug:** `/blog/backlinks-ai-search-citations` (or similar — verify keywords first)
**Why:** GSC queries appearing organically: "will more website citation links help you show up in chatgpt", "chatgpt to create backlinks". `backlinks-from/chatgpt` already ranks (pos 48.7). Topic is timely, low-competition, needs a POV (AI-resistant), and on-positioning.
**Angle:** do backlinks influence ChatGPT / Perplexity / AI Overview citations — evidence, mechanism, what founders should actually do. Interlink with `backlinks-from/chatgpt` and the pillar.
**Before building:** DataForSEO check on `ai search citations`, `chatgpt citations seo`, `llm seo backlinks`, `generative engine optimization backlinks`.

## NEW: Pitchbox buyer-research content

**Why:** ~100 impr of high-intent brand research landing at pos 54–61: `pitchbox pricing` (39), `pitchbox` (35), `pitchbox price` (26), `pitchbox review` (4). Meanwhile `pitchbox alternative` sits at pos 24.7.
**Action:** expand `alternatives/best-pitchbox-alternative-for-founders` with a real pricing breakdown + honest review section (fits transparency positioning), or build a dedicated `compare/pitchbox-pricing` page if the expanded section can't rank for the pricing queries. Same pattern may apply to BuzzStream (`buzzstream alternatives` 57 impr currently hitting the /alternatives hub at pos 58 instead of the dedicated page — internal linking fix).

## Original-data / research assets (only Mentiohunt can write these)

Earn links + AI citations to the whole cluster. Use the opportunity-queue data. Not keyword-driven.

- `articles/saas-backlink-placement-patterns` — placement patterns across SaaS link campaigns (own data)
- `articles/saas-listicle-tool-overlap` — how often SaaS listicles mention the same tools
- `articles/state-of-saas-backlinks-2026` — annual benchmark (recurring linkable asset)

## BOFU expansion (proven cluster — GSC-confirmed it ranks + converts)

Skip thin `X alternative` pages (10–70/mo). Build the **listicle hub** — high-intent, low KD, lists Mentiohunt + competitors:

| Slug                                             | Primary keyword                 | Vol | KD  |
| ------------------------------------------------ | ------------------------------- | --- | --- |
| `articles/best-link-building-tools-for-founders` | best link building tools        | 320 | low |
| (same, secondary)                                | best seo link building software | 90  | 5   |
| (same, secondary)                                | link building software          | 320 | 17  |

GSC support: `linkbuilding software`, `link building resources` queries already appearing (deep positions — no page targets them yet).

Plus 1–2 more `compare/*` only where buyer intent is real (respona / pitchbox / buzzstream variants).

---

# Free tools

Existing: anchor-text-generator, backlink-opportunity-finder, backlink-price-calculator, competitor-backlink-gap, directory-backlink-opportunity-finder, google-index-checker, startup-directories.

## Build (low KD, buildable, product-aligned)

| Slug                                  | Primary keyword            | Vol | KD  | Notes                                                                                                                   |
| ------------------------------------- | -------------------------- | --- | --- | ----------------------------------------------------------------------------------------------------------------------- |
| `free-tools/guest-post-sites-finder`  | guest posting sites        | 390 | 3   | + `guest post sites list` (90, KD16). Pairs with `articles/guest-posting-for-saas` (now live — interlink).              |
| `free-tools/outreach-email-generator` | outreach email template    | 170 | low | + `cold email generator` (70) · `link building outreach email` (50, KD3). Product already drafts outreach — direct CTA. |
| `free-tools/dofollow-link-checker`    | do-follow backlink checker | 320 | 22  | Dofollow/nofollow checker for qualifying prospects. Slightly harder SERP.                                               |

`anchor-text-generator` — built. ✓

## Deprioritized / skip

- `free-tools/google-index-checker` — **dead end, GSC-confirmed**: 106 impr, every index-checker query at pos 80+. Off-ICP, hopeless SERP. No further investment; candidate for eventual removal if it never earns a click.
- `domain authority checker` (12.1k, KD72) · `website authority checker` (12.1k, KD55) · `da pa checker` (9.9k, KD71) · `free backlink checker` (2.9k, KD81) · `email finder tool` (5.4k, KD50) · `spam score checker` (1.6k, KD30) · `backlink generator` (390, KD35 — spammy intent, conflicts with positioning).

---

# Housekeeping (NEW — profile cleanup)

- **Monitoring-era pages are off-strategy** (CLAUDE.md: community monitoring is not part of the product) and pollute the topical profile: `/twitter-monitoring` (86 impr, pos 52.6), `/reddit-monitoring`, `/quora-monitoring`, `/blog/reddit-marketing`, `free-tools/reddit-user-analyzer`. Redirect (301 to nearest relevant page or home) or remove.
- **`/alternatives` hub ranks for off-topic queries** — `trengo alternative` (82 impr), `zutrix`, `socialhose`, `eclincher`, `wordstream`, `hasoffers` (customer-service / social / PPC tools). 330 impr, 0.3% CTR, pos 55. Tighten hub copy to link-building tools only so it stops matching random "X alternative" intents; also make sure `buzzstream alternatives` / `pitchbox alternative` queries resolve to the dedicated pages, not the hub (internal linking + hub de-optimization).
- Long-tail junk in GSC (`ceo inurl:article`, `site:instagram.com ...` strings) = people Googling prospecting footprints and accidentally hitting our pages. Noise — ignore.
