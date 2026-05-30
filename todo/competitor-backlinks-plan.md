# Competitor Backlinks — Implementation Plan

Goal: given a user's competitor domains, find pages linking to them, score relevance, find contact, and generate outreach drafts. Results stored in `backlink_prospects` table with `tier = "competitor_backlink"`.

---

## Input

- Competitor domains from `products.competitors[]`
- DR filter from `backlink_prospects_settings.dr_min` / `dr_max` (per product)
- **Hard cap: 15 pages per competitor domain** — take top 15 by DR after dedup

---

## Phase 1 — Backlink Extraction

**Actor:** `AHREFS_SEO_TOOLS` (`pro100chok~ahrefs-seo-tools`)
**searchType:** `"backlinks"` per competitor domain

Output per backlink (verified from live sample):
```ts
{
  urlFrom: string       // page linking to competitor
  urlTo: string         // competitor URL being linked (path signals intent)
  anchor: string        // what they called the competitor — always populated
  domainRating: number  // DR of the linking domain — always populated
  title: string         // page title — always populated
  textPre: string       // text before anchor — often empty, bonus only
  textPost: string      // text after anchor — often empty, bonus only
}
```

> Run `referring_domains` searchType first to get domain-level count — helps estimate volume before pulling full backlink list.

---

## Phase 2 — Pre-filter

Hard filters, no LLM, no fetch:

- DR within `backlink_prospects_settings.dr_min`–`dr_max` range
- Deduplicate by domain — keep highest DR page per domain
- Skip known noise: `github.com`, `chrome.google.com`, link directories, forum profiles
- **Take top 15 by DR** — hard cap per competitor domain

---

## Phase 3 — Relevance Scoring

Cap: process all 15 results (after pre-filter). LLM calls are cheap at this volume.

### Inputs to LLM

Primary (always available):
- `title` — most reliable signal ("11 free B2B prospecting tools" = roundup)
- `anchor` — what they called the competitor ("email outreach software" vs "Hunter.io")
- `urlTo` path — intent signal:
  - `/pricing` → comparison page
  - `/blog/...` → educational/resource content
  - `/` → general brand mention
  - specific feature paths → feature-focused roundup

Supplementary (include when non-empty):
- `textPre` + `textPost` — absent in majority of results, bonus context only

Also passed:
- User's product name + `product_description` from `products` table

### Output

- Score 1–5
- One-line reason (stored in `raw_post_text` JSON, shown in UI)
- Inferred page type: `roundup` | `comparison` | `resource` | `brand-mention` | `other`

Surface only score ≥ 3.

### Scrapling enrichment

Optional, only for borderline score = 3 and thin title context. Call `SCRAPER_URL` with:
- CSS selector: `title, meta[name="description"], meta[property="og:description"], h1`
- `--ai-targeted` flag

---

## Phase 4 — Contact Enrichment

Reuse existing waterfall from `page-enrich-scrape-plan.md` verbatim. Input is `urlFrom`.

1. Scrape `urlFrom` for author byline, author profile link, meta author, Schema.org markup
2. If no name: scrape `/about`, `/contact`, `/team` on same domain
3. Name found → generate personalized email patterns (`john@`, `john.doe@`, `johndoe@`, etc.)
4. No name → generate generic patterns (`contact@`, `hello@`, `info@`)
5. Validate patterns via `EMAIL_VERIFIER` (`michael.g~email-verifier-validator`)
6. Store first `good` result + confidence in `raw_post_text` JSON

Page type from Phase 3 informs waterfall branch:
- `roundup` or `comparison` + company domain → skip author, target founder/marketing lead via About/Team
- Personal blog → byline first
- Media/news site → use `editor@`, `tips@` generic patterns

Runs async — record created before enrichment completes, updated when done.

---

## Phase 5 — Outreach Draft

Input: `title` + `anchor` + `urlTo` path + `pageType` + contact name + user product description

Draft angle by page type:
- **roundup** → "I noticed your list of [topic] tools — [product] does [X], worth including alongside [competitor]"
- **comparison** → "You compared [competitor] — happy to provide info/trial to include [product] in the comparison"
- **resource/educational** → "[product] could be a useful addition for your readers covering [topic]"
- **brand-mention** → "[product] is an alternative to [competitor] your readers might find useful"

Stored in `email_subject` + `email_body` on the `backlink_prospects` row.

---

## DB Mapping — `backlink_prospects` table

No new table needed. Map onto existing schema:

| `backlink_prospects` column | Value |
|-----------------------------|-------|
| `tier` | `"competitor_backlink"` |
| `action_type` | `"email_outreach"` |
| `product_id` | from product |
| `found_url` | `urlFrom` (page linking to competitor) |
| `target_url` | `urlTo` (competitor URL being linked) |
| `domain` | extracted domain from `urlFrom` |
| `contact_name` | found contact name (nullable) |
| `contact_email` | verified email (nullable) |
| `email_subject` | generated outreach subject |
| `email_body` | generated outreach body |
| `status` | `"new"` on creation |
| `raw_post_text` | JSON blob: `{ anchor, domainRating, pageTitle, pageType, relevanceScore, relevanceReason, competitorDomain, textPre, textPost, contactConfidence }` |

Dedup: unique on `(product_id, domain)` — one opportunity per linking domain per product.

---

## Trigger

Dev/test route only for now. POST endpoint that accepts a `product_id`, pulls competitors + settings, runs the full pipeline, and persists results.

---

## Actors / Services Used

| Step | Actor / Service |
|------|----------------|
| Backlink extraction | `AHREFS_SEO_TOOLS` (existing) |
| Optional page enrichment | `SCRAPER_URL` Scrapling service (existing) |
| Author/contact scraping | `SCRAPER_URL` Scrapling service (existing) |
| Email verification | `EMAIL_VERIFIER` (existing) |
| Relevance scoring | LLM call (inline) |
| Outreach draft | LLM call (inline) |

No new Apify actors needed.
