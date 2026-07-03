# Contact Enrichment — Improvement Plan

**Status:** Planning (no build this session)
**Last updated:** 2026-07-03
**Goal:** Increase the yield of *personal company emails* (e.g. `jane@`, `jane.doe@company.com`) from the contact-enrichment pipeline, without adding paid B2B data subscriptions.

---

## Constraints & principles

These shape every decision below:

- **No paid B2B databases.** No Hunter, Apollo, Clearbit, Snov, RocketReach, etc.
- **Prefer Apify for real-time scraping.** When we need external data, scrape it live via Apify actors (reusing the ones we already own where possible) rather than buying a dataset.
- **Honest confidence.** Per `CLAUDE.md`: never present a guessed/unverified address as verified contact intelligence. Externally-inferred emails must be labeled as such, with the source recorded.
- **Cost-gated.** Onboarding runs are deliberately cheap (`ONBOARDING_PROSPECT_BUDGET = 5`, light caps in `run-onboarding-jobs.ts:15-17`). Any Apify-backed step must be gated to run only when cheaper sources have failed, and must stop the moment a verified personal email is found. Daily jobs run at full defaults, so metered actor spend scales.

---

## How enrichment works today (current-state map)

Entry points → the personal-email engine spans three layers:

1. **Python LLM crawl agent** — `apps/scraper/agent_enrich.py` (`run_agent_scrape`)
   - LLM agent crawls up to `MAX_PAGES = 6` pages, wall-clock budget `AGENT_BUDGET_SECONDS = 180`.
   - Per page (`_execute_scrape_page`): regex emails + `mailto:` hrefs, social links, author hints (`meta[name=author]`, `article:author`, JSON-LD `author.name`), contact-form URL, internal links (capped 20) for navigation.
   - Classifies each email `personal`/`general` deterministically via `_is_personal` (overrides the LLM's self-graded type at `agent_enrich.py:492`).
   - Helpers live in `apps/scraper/core.py` (`fetch_page` tiered light→dynamic→stealthy, `extract_emails_from_text`, `extract_social_links`, `find_contact_form_url`).
   - Invoked over HTTP by the server at `/agent-scrape`; also reused inline for unlinked mentions via `apps/scraper/routes/check_mention.py`.

2. **Server enrichment / pattern engine** — `apps/server/src/methods/competitor-backlinks/enrich-contact.ts`
   - `resolveContactEmail`: filters placeholders → if emails found, verify them → if a **name** was found but no verifiable email, **generate patterns** (`generatePersonalizedPatterns`, line 68) and verify → else fall back to generic patterns (`contact@`, `hello@`, `info@`, `hi@`).
   - Name/email sanitation in `contact-validation.ts`.

3. **Verification** — `apps/server/src/helpers/actors/email-verifier.ts` (Apify `michael.g~email-verifier-validator`), returns `good | risky | bad` via syntax/MX/SMTP/catch-all checks.

**Assets already available for the new work:** generic Apify runner (`run-apify-actor.ts`), Google SERP actor (`google-serp-scraper.ts`, `SCRAPERLINK_GOOGLE_SERP`), tweet scraper (`tweet-scraper.ts`), email verifier. **Not** present: any identity/email provider (by design — see constraints).

**Key architectural insight:** the personal-email engine already exists — it's *name → pattern → verify*. We get mostly generic emails not because that engine is missing, but because it's **starved** (no name → no patterns) and **leaky** (good guesses discarded). Part A fixes the leaks; Part B feeds it when the domain is silent.

---

## Part A — Bugs & improvements in the existing code

Ordered by return-on-effort. The single highest-impact change is **A7 (resolver ordering)** — cheap, pure server-side logic, and it directly targets the "too many generic emails" complaint. Items A1 and A5 are also small, self-contained, and recover emails we already partially collect.

### A1. Cloudflare-obfuscated emails are collected then thrown away  ⭐ highest ROI

**Problem:** `_execute_scrape_page` harvests the obfuscation payloads but only logs them — never decodes them:
```python
cf_obfuscated_emails = [el.attrib.get("data-cfemail", "") for el in page.css("[data-cfemail]")]
cf_protection_hrefs   = [el.attrib.get("href", "") for el in page.css('a[href*="cdn-cgi/l/email-protection"]')]
```
(`agent_enrich.py:234-240`). On the WordPress + Cloudflare sites that dominate the corpus, the *personal* email is exactly what gets Cloudflare-obfuscated. And because the tiered fetcher returns the first fetch with ≥500 chars — often the JS-free `light` httpx fetch (`core.py:296-298`) — Cloudflare's client-side decoder never runs, so the regex sees `[email protected]` placeholder text.

**Fix:**
- Decode `data-cfemail` server-side: the hex value's first byte is the XOR key; XOR each subsequent byte with it to recover ASCII. Same encoding applies to the hex fragment in `cdn-cgi/l/email-protection#<hex>` hrefs. Merge decoded addresses into the emails list.
- While here, add textual + markup de-obfuscation to `extract_emails_from_text` (`core.py:217`): `name [at] domain [dot] com`, `name(at)domain`, spaced `@`, HTML entities around `@`/`.` (`&#64;`, `&commat;`, `&period;`), and JavaScript string-concatenated `mailto:` links (addresses assembled from fragments in inline scripts).

**Impact:** Converts a meaningful slice of "generic-only" results into personal, regardless of fetch tier. Low risk, ~small diff.

### A5. Substring classifier mislabels real names as "generic"

**Problem:** `_is_personal` classifies by substring membership:
```python
prefix = email.split("@")[0].lower()
return not any(p in prefix for p in _GENERIC_PREFIXES)
```
(`agent_enrich.py:133-135`). Because `_GENERIC_PREFIXES` contains short tokens like `"hr"` and `"mail"`:
- `chris@`, `christine@`, `christopher@`, `mehran@` → contain **"hr"** → labeled general
- `ismail@` → contains **"mail"** → labeled general

This classifier is authoritative (`agent_enrich.py:492`). Downstream harm: `resolveContactEmail` picks the risky-rescue anchor as the first `type === "personal"` (`enrich-contact.ts:219`); a mislabeled `chris@` that verifies `risky` won't be rescued and gets dropped, and it downgrades the Python `confidence` from `personalized` to `email-only`.

**Fix:** match whole prefixes or prefix boundaries (`prefix == p`, or `prefix.startswith(p + ".")` / `p + "-"`) instead of `p in prefix`.

**Impact:** Stops silently discarding/downgrading a whole class of common personal emails. Trivial diff.

### A2. Name discovery is too shallow (the gate on the whole engine)

**Problem:** Pattern generation only runs if a clean human name exists (`enrich-contact.ts:237`). No name → no personal patterns → generic fallback. Today `_extract_author_hints` reads only `meta[name=author]`, `article:author`, JSON-LD `author.name` (`agent_enrich.py:148-178`).

**Fix — add deterministic name sources:**
- `rel="author"` links and `/author/{slug}` URLs (WordPress author archives encode the name in the slug — huge on this corpus).
- Deeper JSON-LD: resolve `author` given as `@id` into `@graph`; read `Person` nodes and their `sameAs` (often the author's LinkedIn URL → name + identity anchor).
- Byline regex fallback: `By <Name>`, `Written by`, `Words by`, `Author:`.
- OpenGraph `profile:first_name` / `profile:last_name`; `article:author` when it's a profile URL.
- Feed the LinkedIn slug from `social_links` back as a name hint when page extraction fails.
- **Wire the deterministic `author_hints` through to the server.** `_extract_author_hints` already collects hints (`agent_enrich.py:148-178`, added to the tool result at `281, 296-297`), but `AgentScrapeResponse` (`agent_enrich.py:123-131`) omits them — so the server only ever sees the LLM's final `name`. If the LLM drops the name or sanitization rejects it, pattern generation never runs. Add `author_hints` to the response (and/or have the scraper deterministically adopt the first valid human-looking hint as `name` when the LLM returns none) so the pattern engine always has a fallback identity.
- **Extract `author_url` as structured data**, not just the name — from JSON-LD `Person.url`, `rel="author"`, byline links, and `/author/` links — and prioritize crawling that profile page *before* `/contact` (ties into A9).

**Impact:** Multiplies personal-email yield — every extra name is a new pattern-engine run.

### A3. Catch-all domains discard perfectly good guesses

**Problem:** Small B2B SaaS domains (the ICP) are often catch-all. On catch-all the verifier returns `catch_all` (status `risky`/`unknown`, never `good`). For a *generated* pattern, `verifyPatterns(generated, domain)` is called with no `scrapedEmail` and `allowRiskyFallback` defaulting to false (`enrich-contact.ts:238-239`) → `good` null, `riskyScraped` can't match, `riskyAny` disabled → **returns null** → drops to generic (`enrich-contact.ts:253`). So on exactly the domains where guessing is safest, we email `contact@` instead of the correct `first.last@`.

**Fix:** When the domain verifies as catch-all, accept the top-priority generated pattern as a best-effort personal email, tagged with honest confidence (see Part C `inferred`). Pairs directly with A4 (format inference tells you *which* pattern to trust, since catch-all accepts them all equally).

### A4. No domain email-format learning

**Problem:** Every email is treated independently. If we observe even one real `name ↔ email` pair on the domain (the `/team` and `/about` pages the agent already visits list these), we've learned the company's convention and can generate the author's address with high confidence. `generatePersonalizedPatterns` also emits `first@` first unconditionally (`enrich-contact.ts:74`), which is wrong for most company domains that use `first.last@`; on catch-all the first pattern wins by default, so the prior matters.

**Fix:**
- Add a **format-inference helper**: given one `(name, email)` pair, back out which pattern template produced it, then apply that template to the article author's name.
- Reorder `generatePersonalizedPatterns` by empirical frequency, and prefer the inferred template when one exists.

**Impact:** This is the DIY replacement for a paid provider's "pattern" field, and the only reliable disambiguator on catch-all/Google domains.

### A6. Two heuristics that suppress work

**A6a — Media heuristic skips the author entirely.** For `pageType === "other"` on any domain matching `news|magazine|press|media|journal|times|post|daily|weekly`, the scraper is skipped and we go straight to generic patterns (`enrich-contact.ts:135-161`) — but media sites have the clearest bylines *and* the most guessable conventions. **Fix:** for media sites, keep skipping the deep 6-page crawl (cost), but still extract the byline author and run name → pattern → verify.

**A6b — Budget mismatch discards late results.** Agent deadline is 180s (`agent_enrich.py:17`) while the server aborts at 120s (`enrich-contact.ts:54`, `AbortSignal.timeout(120_000)`). An agent still working at second 130 has its entire result discarded — including a personal email it just found. **Fix:** lower the agent deadline to land under the caller's timeout (~100-105s) so it always returns best-effort. (Note per-request model timeout is 90s, so one slow page can already blow the budget.)

### A7. Resolver ordering: generated personal patterns must beat scraped generic emails  ⭐ highest impact

**Problem:** In `resolveContactEmail`, if the scraper returns *any* valid email — including `info@`, `hello@`, `contact@` — those are verified first (`enrich-contact.ts:214-233`) and the function returns on the first `good`. Name-based personal pattern generation only runs *afterward*, and *only if no scraped email verified* (`enrich-contact.ts:237-250`). So when the scraper finds both `info@company.com` and the author "Jane Smith", the system can verify and return `info@company.com` before it ever generates `jane@` / `jane.smith@`. This is likely the primary reason generic emails dominate the output — it's a resolver-priority problem, not a crawler problem.

**Fix:** verify in explicit priority tiers, returning on the first tier that yields a verified address:
1. Scraped personal emails
2. Generated personal patterns from the author/founder name (using the A4-inferred format first)
3. Scraped generic emails
4. Generated generic patterns (the current `contact@`/`hello@`/`info@`/`hi@` fallback)

Preserves the generic safety net but gives personal company emails a fair chance before a generic one wins. Cheap, pure server-side logic, no new dependencies.

### A8. `verifyPatterns` ignores candidate priority order

**Problem:** `verifyPatterns` picks `results.find((r) => r.status === "good")` (`enrich-contact.ts:107`), where `results` is the verifier actor's output array. That order is not guaranteed to match the input `candidates` order, so the personal-first sort at `enrich-contact.ts:216-218` is effectively cosmetic — if both a personal and a generic candidate verify `good`, whichever the actor happens to list first wins.

**Fix:** after verification, select the `good` result by walking the *input* priority order rather than the actor's output order — or verify tier-by-tier per A7, which enforces priority by construction and makes this moot.

### A9. Deterministic high-yield page seeding before the LLM crawl

**Problem:** the agent gets up to `MAX_PAGES = 6` and chooses freely from discovered internal links, so it can spend budget on low-value pages and miss the profile/team pages where personal emails live.

**Fix:** before (or alongside) the LLM, deterministically seed a prioritized candidate-URL list and crawl the highest-value paths first: `/author/{slug}` and the extracted `author_url` (A2), then `/team`, `/about`, `/about-us`, `/people`, `/our-team`, `/staff`, `/editorial-team`, `/contributors`, `/press`, `/media-kit`, then `/contact`. For article authors the profile page should be crawled before generic contact pages. Raises hit rate and reclaims LLM iterations (eases A6b's budget pressure).

---

## Part B — Cold start: no name AND no email on the page/domain

When the page and domain are silent, stop reading the site and **pivot off-domain to resolve the identity in real time**, then re-enter the Part A engine. The problem reduces to two sub-goals: (1) get a name from anywhere → feeds the pattern generator; (2) learn the domain's email format from anywhere → tells us which pattern to trust.

### B1. Name discovery via real-time scraping

- **SERP dorking** with the actor we already own (`SCRAPERLINK_GOOGLE_SERP`), snippets read by the LLM:
  - `site:linkedin.com/in "<company name>"` → founder/editor name from the result title
  - `"<domain>" (founder OR editor OR "head of content" OR "managing editor")`
  - `"<company>" (team OR about OR contact)`
  - `"@<domain>"` → raw addresses already indexed on directories, press releases, speaker/podcast bios, PDFs
- **Name-targeted SERP queries** once a clean name is known (complements the company-oriented queries above): `"Jane Smith" "@company.com"`, `"Jane Smith" "company.com" email`, `"Jane Smith" "<Company Name>" contact`, `site:company.com/author "Jane Smith"`, `site:company.com "Jane Smith" "@company.com"`. Gate to run only when a clean name exists, no scraped personal email verified, and a personal address would beat the generic one we already hold.
- **LinkedIn company → people** via a real-time Apify LinkedIn actor (only if SERP is thin) — pure name source. Note LinkedIn scraping is a ToS gray area; keep it a fallback. Use public LinkedIn/Twitter identity to **confirm the person's current company and role before generating patterns** — this avoids guessing emails for the wrong "Jane Smith". Identity only; do not scrape private emails from social platforms.
- **GitHub** (free API, no Apify) — standout for dev-tool/SaaS domains: org members' public profile emails *and* commit-author emails are frequently real `first@company.com` addresses.
- **Twitter/X** via existing `tweet-scraper.ts` — founder bio/Linktree → personal site → email.

### B2. Email-format inference (the key unlock)

DIY replacement for a paid provider's pattern field. Any time we scrape *any* `name ↔ email` pair — a `/team` page ("Sarah Jones — sarah.jones@company.com"), a `"@domain"` SERP hit, a GitHub commit by "Mike Ross" as `mross@company.com`, a non-redacted WHOIS record — infer the template and apply it to the article author's name. Shared helper with A4.

### B3. Free signals

- **MX lookup (DNS):** determines the mail provider and thus the verification strategy — Google Workspace largely defeats SMTP verification (accept-all/greylisting) so the verifier returns `risky`/`unknown` even for correct addresses; on those, trust inferred pattern + cross-source agreement instead of waiting for `good`. Zoho/M365/self-hosted differ.
- **WHOIS / RDAP:** free public RDAP endpoints; mostly redacted post-GDPR, but small/older domains still leak a registrant name/email — doubles as a format-inference pair.

### B4. Strategic reframe — sometimes the author isn't the right contact

If the byline is a freelancer/ghostwriter and the domain is silent, the actionable contact for link building is the site's **editor / "Write for us" / partnerships owner**, not a personal email that may not exist. A "no personal author found" state should pivot to finding the editorial/guest-post contact (a `/write-for-us` or `/contribute` page, or a LinkedIn "Editor at X"). This matches the outreach purpose better than forcing a personal guess.

---

## Part C — The enrichment waterfall (target architecture)

Cascade that escalates cost only when needed and stops on the first verified personal email:

1. **On-page scrape** (current) + CF-decode (A1) + deeper name extraction (A2)
2. **Harvest any `name↔email` pair seen so far → infer domain format** (A4/B2)
3. **Free off-domain:** SERP dork (name + raw emails), GitHub commit emails, Twitter bio (B1)
4. **MX lookup** → choose verification strategy (B3)
5. **Apply inferred format / generate patterns** to the author name → verify; on catch-all accept top pattern as best-effort (A3)
6. **Generic fallback** (current)

**Gating:** steps 3+ (Apify-backed) run only when nothing verified yet; stop immediately on a verified personal hit.

**Confidence model:** extend the enum `personalized | email-only | generic | none` with an **`inferred`** tier for format-inferred / SMTP-unconfirmed addresses, and record the **source** (`serp`, `github`, `format-inference`, `catch-all-guess`, …). Cross-source agreement (e.g. SERP name + inferred format + MX match) is the confidence signal when SMTP can't return `good`. Honors the `CLAUDE.md` "don't present unverified as verified" rule.

For measurement, make the source granular enough to track whether changes actually increase *truly personal* contacts — e.g. `scraped_personal_verified`, `generated_personal_verified`, `scraped_generic_verified`, `generated_generic_verified`, `contact_form_only`, `name_only`. These map 1:1 onto the A7 priority tiers and let us report the personal-vs-generic mix over time.

---

## Suggested sequencing

**Phase 1 — quick wins (self-contained, low risk):**
- **A7 resolver reordering (personal patterns before scraped generic) — highest impact, do first**
- A8 honor candidate priority in `verifyPatterns` (folds into A7's tiered verification)
- A1 Cloudflare email decode + textual/markup de-obfuscation
- A5 classifier boundary-match fix
- A6b budget alignment

**Phase 2 — feed & keep the engine (structural multipliers):**
- A2 deeper name extraction + `author_hints` passthrough + `author_url` structured extraction
- A9 deterministic high-yield page seeding before the LLM crawl
- A4 email-format inference helper + pattern reorder
- A3 catch-all best-effort acceptance
- A6a media-site byline path

**Phase 3 — cold-start waterfall (new capability):**
- B2 format inference wired into the waterfall (shared with A4)
- B1 SERP harvester on `SCRAPERLINK_GOOGLE_SERP` (name + raw emails) — zero new paid deps
- B3 MX lookup + RDAP
- GitHub enrichment for dev-tool domains
- C confidence enum + source tracking; cost gating

**Cheapest highest-impact change:** A7 resolver reordering — pure server-side logic, no new dependencies, directly reduces generic-email wins. Do this first, regardless of everything else.

**Recommended first build (when we move past planning):** the SERP-driven harvester (B1) + the format-inference helper (A4/B2), since together they attack both cold-start failure modes using only real-time Apify scraping and free lookups. Phase 1 items can land independently and immediately.

---

## Open questions / decisions to revisit

- Which real-time Apify LinkedIn actor (if any) — and are we comfortable with the ToS gray area, or keep LinkedIn to SERP-title extraction only?
- Per-prospect cost ceiling for Apify-backed steps in onboarding vs. daily jobs.
- Where `inferred`-confidence contacts surface in the product UI, and whether they're auto-included in outreach drafts or held for review.
- Do we persist the inferred domain email-format on the product/domain record to reuse across prospects on the same site?
