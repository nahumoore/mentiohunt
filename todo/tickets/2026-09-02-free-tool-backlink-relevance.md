# Make the two free backlink tools return relevant opportunities

- **Status:** Not started
- **Priority:** P1
- **Scope:** The two public lead-gen tools that return a list of "opportunities" from a
  single URL:
  - `/free-tools/competitor-backlink-gap` → web route
    `apps/web/app/api/free-tool/competitor-backlink-gap/route.ts` → server route
    `apps/server/src/routes/free-tool-competitor-backlink-gap.ts`
  - `/free-tools/backlink-opportunity-finder` → web route
    `apps/web/app/api/free-tool/backlink-opportunity-finder/route.ts` → server route
    `apps/server/src/routes/free-tool-backlink-opportunity-finder.ts`
  Covers how each tool decides what a site's market is, how candidate pages are found, and
  what relevance/quality gate (if any) runs before results are shown.
- **Out of scope:** The other free tools. Contact enrichment, email verification, outreach
  drafting — these tools never touch those. Rate limiting. The marketing copy on the tool
  pages (except where a results-count or "no results" state needs an honest message).
- **Related:** `2026-09-02-speed-up-and-widen-onboarding-preview-discovery.md` describes the
  same class of problem (weak relevance gating, link-farm competitors, footprint queries
  that pull enterprise/spam pages) in the logged-in onboarding preview. The fixes here
  should reuse the same shared helpers so both surfaces improve together:
  `score-site-relevance.ts`, `url-filters.ts`, `enrich-domain-ratings.ts`.

## Problem

Both tools return opportunities that are not relevant to the submitted site. Reported for
these six real submissions, all newer/smaller B2B products with thin homepages and
non-descriptive brand names:

| Product | URL |
|---|---|
| PlusEcode (Upc2gs1qr) | `https://upc2gs1qr.barzig.com` |
| InvisibleExit | `https://invisibleexit.com/` |
| Brosavo | `https://www.brosavo.com/real-estate-crm` |
| Scrinly | `https://scrinly.com/` |
| IndexLaunch | `https://indexlaunch.site` |
| Pomeroy App | `https://www.pomeroy.app/` |

These are the tools a first-time visitor uses to judge whether Mentiohunt is worth signing
up for. An off-topic result list is a direct conversion problem.

## Root causes

### competitor-backlink-gap — there is no relevance gate at all

`free-tool-competitor-backlink-gap.ts` does, in order:

1. `generateCompetitorDomains(url)` — an LLM reads the homepage and names 3–5 competitor
   root domains. Only the **first 3** are kept (`generate-competitors.ts`, `.slice(0, 3)`).
2. For each competitor, `extractBacklinks(domain, { dr_min: 20, dr_max: 65 })` pulls that
   competitor's backlinks from DataForSEO.
3. `filterBacklinks(...)` applies **only**: the DR 20–65 band, `isNoisyUrl` (a ~25-entry
   social/aggregator domain list plus `/user/ /profile/ /members/ /author/` path
   segments), and a drop of the submitted site's own domain. Then dedup by linking domain,
   cap 15 per competitor.
4. Response keeps the top 5 per competitor by DR. `reason` is hardcoded `null`. `type` is a
   crude path-keyword guess (`inferType`).

Nothing checks whether a linking page has anything to do with the submitted site's market.
Every page that links a competitor and clears the DR band is shown as a "gap." That
surfaces PBN / link-farm pages, foreign-language directory dumps, press-release
syndication, and unrelated blogs that happened to link the competitor once. The
`isNoisyUrl` filter catches none of this — the onboarding ticket documents the same
noise filter passing titles like `🏆🏆Boost your Google rankings with Premium PBN`.

Compounding it: for an obscure input (`upc2gs1qr.barzig.com`, a random-string subdomain
with almost no homepage text) the LLM in step 1 has nothing to work with and returns
plausible-sounding but wrong competitors. Every downstream backlink is then from the wrong
market by construction. There is no confidence signal on `generateCompetitorDomains` and no
"we couldn't identify your competitors" path — it either returns 3 domains or throws.

Other hardcoded ceilings that hurt these inputs: `MAX_DOMAIN_RATING = 65` (drops the most
authoritative real links), only 3 competitors, 5 gaps each.

### backlink-opportunity-finder — the market signal is a `<title>` tag, and the gate is `score > 0`

`route.ts` (web) sets `productName = siteDetails.title` — the raw `<title>` tag,
verbatim. For these inputs that is a tagline or a bare brand word, not a product
description. That string is the primary input to:

1. `deriveNiches(productName, siteContext)` — an LLM returns 1–2 niche phrases. On failure
   or thin input it **falls back to `[productName]`** — i.e. the raw title becomes the
   "niche."
2. `buildQueryPlan` — for each niche, 4 footprint templates from
   `OPPORTUNITY_QUERY_TEMPLATES`: `"{niche}" intitle:resources`, `"{niche}" "useful links"`,
   `"{niche}" ("best tools" OR "top tools")`, `"{niche}" ("recommended tools" OR "software
   list")`. So a bad niche produces queries like `"Brosavo" intitle:resources` or
   `"IndexLaunch" "useful links"` — which return near-nothing, or the footprint aggregators
   themselves.
3. Google SERP scrape, dedup to first (top-ranked) URL per domain, drop own domain +
   `isNoiseDomain`, cap 40 candidates.
4. `scoreSiteRelevance(candidates, { product_name, product_description })` where
   `product_description = siteContext?.metaDescription ?? productName`. No `target_keywords`
   (that param exists but is never passed here). If the meta description is missing, the
   scorer is grading against the bare title too.
5. **`.filter(({ score }) => score > 0)`**, sort desc, take top 10. A candidate the model
   scored 5 ("no alignment — different market entirely") is still returned. `highFit`
   (score ≥ 75) is only a display count, not a filter. So the list is "top 10 by score"
   even when every one of them is weak.

`dr` is fetched via `enrichDomainRatings` **after** scoring but is never used to filter —
DR 0 / null results are shown.

The footprint templates themselves bias toward exactly the low-value pages that rank for
`intitle:resources` / `"useful links"`: stale university link lists, scraped directories,
SEO link-farm "resource" pages. They do not find the niche blogs, newsletters, and podcast
show-notes that a small B2B product can realistically get links from.

## Outcome

For a submission with a thin homepage and a generic brand name, each tool should either:

- return a list where **every shown item is plausibly in the submitted site's market**, or
- return **fewer items, honestly** — down to zero with a "we couldn't confidently identify
  enough relevant opportunities for this site" message — rather than padding the list to 10
  with off-topic domains.

No fabricated confidence. A short relevant list beats a long irrelevant one for a tool
whose job is to make someone trust the product.

## Required changes

### competitor-backlink-gap

1. **Add a relevance gate.** After `filterBacklinks`, run the surviving linking pages
   through `scoreSiteRelevance` using the submitted site's `title` + `metaDescription`
   (fetch them the same way the opportunity-finder web route does via `fetchSiteDetails`,
   or via `extractPageContent` already loaded in `generateCompetitorDomains`). Drop
   anything below a moderate threshold (start at **50**; tune against the six inputs).
   Populate the currently-`null` `reason` field with the one-line rationale from scoring so
   the UI can show why each gap is relevant.
2. **Reuse the spam screen** from the onboarding ticket's `url-filters.ts` work (PBN /
   aged-domain / "buy backlinks" phrases in the page title, emoji-stuffed titles,
   `/page-<32hex>.html` and `/all/<n>/<n>.html` path shapes). If that ticket lands first,
   just call the shared helper; if this one lands first, add the helper here and let the
   other consume it.
3. **Handle low-confidence competitor identification.** Have `generateCompetitorDomains`
   return a confidence signal (e.g. based on homepage text length and whether the model
   returned the full 3–5 vs. was reduced by filtering). When confidence is low or fewer
   than 2 competitors survive, return a `422`-style "couldn't identify your competitors
   from this page — try your main marketing URL" response instead of proceeding with
   guesses.
4. **Raise `MAX_DOMAIN_RATING`** from 65 to 90 (or drop the ceiling) for this tool — there
   is no outreach reply-rate concern here, it just shows a list. Keep `MIN_DOMAIN_RATING`
   at 20 to filter junk.

### backlink-opportunity-finder

5. **Derive a real product description, not the `<title>`.** In `deriveNiches` (or a small
   step before it), when `siteContext` is thin, summarize `h1` + first paragraphs into a
   one-sentence product description with an LLM and use that as both the niche seed and the
   `product_description` passed to `scoreSiteRelevance`. Never let the raw `<title>` become
   the "niche" — if niche derivation genuinely fails, return zero results with the honest
   message rather than querying `"BrandName" intitle:resources`.
6. **Add a score floor.** Replace `.filter(({ score }) => score > 0)` with a real minimum
   (start at **50**). Let the result count fall out of that — do not backfill to 10.
7. **Add a DR floor.** Move `enrichDomainRatings` before the final slice and drop domains
   below DR 15–20 (tune), handling `null` explicitly (a failed lookup is not an automatic
   drop, but a genuine DR 0 is).
8. **Broaden beyond footprint templates.** Add query templates that find real niche
   editorial surfaces, not just link pages: `"{niche}" newsletter`, `"{niche}" podcast`,
   `best "{niche}" blogs`, `"{niche}" "alternatives"` (roundups that already list small
   tools). Keep 1–2 of the existing footprint templates; drop the weakest.
9. **Dedup smarter.** Keeping the top-ranked URL per domain often keeps the footprint
   aggregator's own hub page. Prefer a URL whose path/title looks like an article or
   resource list over the domain root.

### Shared

10. **Honest empty/short state.** Both tools' result payloads already carry a `summary`
    with counts. The tool pages (`tool.tsx` for each) must render a clear "we found N
    relevant opportunities" and a distinct "we couldn't confidently find relevant
    opportunities for this site — this usually means the site is very new or the URL we
    read had little content" state. No silent list of 10 weak domains.

## Explicitly unchanged

- Neither tool performs or gains contact enrichment, email verification, outreach copy, or
  sequence creation.
- Rate limiting (`checkRateLimit` / `checkFreeToolRateLimit`) is untouched.
- The onboarding preview pipeline is not modified by this ticket (its sibling ticket owns
  it); only shared helpers in `url-filters.ts` / `score-site-relevance.ts` /
  `enrich-domain-ratings.ts` may change, and those changes must be safe for both callers.

## Acceptance criteria

- For each of the six URLs above, every opportunity returned by either tool is in the
  submitted site's market on manual inspection, **or** the tool returns the honest
  low-confidence / empty state.
- `competitor-backlink-gap` runs every surviving linking page through relevance scoring;
  no gap with a score below the threshold is returned; every returned gap has a non-null
  `reason`.
- `competitor-backlink-gap` returns the "couldn't identify competitors" response for
  `upc2gs1qr.barzig.com` rather than a list built on guessed competitors.
- `backlink-opportunity-finder` never uses the raw `<title>` as a niche phrase or as the
  `product_description` for scoring.
- `backlink-opportunity-finder` returns no opportunity scored below the floor and none
  below the DR floor; the result count is whatever survives, not padded to 10.
- Both tool pages show an explicit relevant-count and an explicit empty/low-confidence
  state.
- A known link-farm linking page (emoji title / PBN phrasing) is dropped before it reaches
  the results of `competitor-backlink-gap`.

## Tests

- Add a fixture-driven test per tool that feeds the six URLs (recorded homepage HTML +
  recorded DataForSEO / SERP responses) and asserts either all-relevant or honest-empty.
- Unit-test the new score floor and DR floor in `find-backlink-opportunities-by-url.ts`.
- Unit-test the low-confidence branch of `generateCompetitorDomains` (thin homepage → low
  confidence → tool returns the identify-failure response).
- Unit-test the spam screen against the link-farm title/path patterns.
- Verify neither tool creates contact rows, verification jobs, outreach drafts, or
  sequences (assert on the absence, same as the onboarding ticket).

## Relevant files

- `apps/server/src/routes/free-tool-competitor-backlink-gap.ts` — add relevance gate,
  raise DR ceiling, wire low-confidence response
- `apps/server/src/methods/competitor-domains/generate-competitors.ts` — return a
  confidence signal; stop silently `.slice(0, 3)`-ing away a weak result
- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/filter-backlinks.ts`
  and `extract-backlinks.ts` — spam screen, DR band
- `apps/server/src/routes/free-tool-backlink-opportunity-finder.ts` — pass a real
  description through
- `apps/server/src/methods/backlink-opportunities/find-backlink-opportunities-by-url.ts` —
  score floor, DR floor, smarter dedup
- `apps/server/src/methods/backlink-opportunities/types.ts` — query templates
- `apps/server/src/methods/guest-post-sites/derive-niches.ts` — description-first niche
  seeding, remove the raw-title fallback
- `apps/web/app/api/free-tool/backlink-opportunity-finder/route.ts` — `productName` is the
  raw `<title>`; derive a description instead
- `apps/web/app/api/free-tool/competitor-backlink-gap/route.ts` — forward site context so
  the server can score relevance
- `apps/server/src/methods/prospect-generation-methods/shared/score-site-relevance.ts`,
  `url-filters.ts`, `enrich-domain-ratings.ts` — shared helpers (keep onboarding-preview
  caller safe)
- `apps/web/app/free-tools/competitor-backlink-gap/tool.tsx`,
  `apps/web/app/free-tools/backlink-opportunity-finder/tool.tsx` — honest count + empty
  state
