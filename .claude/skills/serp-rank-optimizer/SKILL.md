---
name: serp-rank-optimizer
description: >
  Diagnoses why one specific Mentiohunt content page isn't ranking better for its target
  keyword, by combining live SERP competitor research with Google Search Console data for
  that exact URL. Use when the user gives a live URL and asks things like "why isn't this
  page ranking", "check this page against the competition", "what's outranking us for X",
  "how do we get this page to page 1", or "improve this page's SEO" for a SINGLE published
  page (not a site-wide audit). Also trigger when the user asks to check a page's Search
  Console status — indexing, impressions, clicks, position, or which queries it's picking up
  traction for. Different from seo-audit (site-wide technical crawl) and seo-content (E-E-A-T
  scoring rubric) — this skill is keyword-vs-competitor and keyword-vs-GSC-reality focused,
  for one page at a time.
---

# SERP Rank Optimizer

One page, one target keyword, two questions: what does Google currently think of this page
(GSC), and what does it think of the pages beating it (live SERP)? Recommendations only mean
something once both are answered — a page can lose to thin competitors because it's not
indexed, or lose to a much stronger competitor despite perfect technicals. Don't skip either
half.

## Step 1: Fetch the target page

Use `WebFetch` on the URL the user gave you. Pull out:

- `<title>`, meta description, H1, heading structure (H2/H3)
- Word count (rough) and what topics/subtopics it actually covers
- Any existing internal/external links

If the URL maps to a local MDX file, read that too (frontmatter often has the actual
`title`/`metaDescription`/`faqs` more reliably than the rendered HTML). Mentiohunt's resource
map:

| Directory | URL prefix |
|---|---|
| `apps/web/resources/articles/{slug}.mdx` | `/blog/{slug}` |
| `apps/web/resources/backlinks-from/{slug}.mdx` | `/backlinks-from/{slug}` |
| `apps/web/resources/alternatives/{slug}.mdx` | `/alternatives/{slug}` |
| `apps/web/resources/compare/{slug}.mdx` | `/compare/{slug}` |
| `apps/web/resources/free-tools/{slug}.mdx` | `/free-tools/{slug}` |
| `apps/web/resources/outreach-templates/{slug}.mdx` | `/outreach-templates/{slug}` |

Having the local file ready matters later — it's what you'd edit in Step 5.

## Step 2: Work out the target keyword

Don't guess from a single signal — triangulate from three, since they can disagree and the
disagreement itself is informative:

1. **On-page signal**: title / H1 / frontmatter `slug` — what the page was clearly written to target.
2. **URL signal**: the slug itself, since Mentiohunt's resource slugs are usually keyword-shaped
   (e.g. `/backlinks-from/medium` → "backlinks from medium").
3. **Reality signal from GSC**: call `mcp__gscServer__list_properties` to get the exact
   `site_url`, then `mcp__gscServer__get_search_by_page_query` for this page to see what
   queries it's *actually* getting impressions/clicks for right now. This is often the most
   honest signal — a page can be "written for" one phrase but Google is actually showing it
   for another.

If all three roughly agree, proceed with that keyword. If they diverge meaningfully (e.g. the
page is written for "buzzstream alternative" but GSC shows most impressions on "buzzstream
pricing"), surface the mismatch to the user and ask which keyword they want optimized for —
this is a real fork in strategy, not a detail to silently resolve.

## Step 3: Pull the GSC status for this URL

Using the `site_url` from `list_properties`:

- `mcp__gscServer__inspect_url_enhanced` — is it indexed? Any coverage issues?
- `mcp__gscServer__get_search_by_page_query` (28-90 days) — current position per query, clicks, impressions, CTR
- `mcp__gscServer__check_indexing_issues` — only if inspection flagged something worth digging into

Don't present raw numbers alone — translate them. "Position 14, 800 impressions, 3 clicks,
0.4% CTR" means: Google shows it, users don't click it — that's a title/meta problem, not a
content-depth problem. "Not indexed" means every SERP-gap recommendation below is moot until
that's fixed first — lead the report with it if so.

## Step 4: Research the live SERP

Run `WebSearch` for the target keyword. Treat result order as the current ranking order (it's
the best available proxy without a dedicated rank-tracking API). For the top 5-8 organic
results:

- Note what each one covers that the target page doesn't (a subtopic, an angle, a data point,
  an FAQ, a comparison table)
- `WebFetch` the 2-3 strongest-looking competitors to check their actual structure — heading
  flow, depth, format (listicle vs. guide vs. tool page), whether they answer the query
  directly near the top
- Look for patterns across multiple competitors, not just one outlier — if 6 of 8 results have
  a pricing comparison table and Mentiohunt's page doesn't, that's a real gap; if only 1 does,
  it's not necessarily worth copying

The goal isn't "make the page longer" — Google's own guidance is that word count isn't a
ranking factor. The goal is: what does someone searching this term actually need that they
can currently only get from a competitor?

## Step 5: Write the report

```
## Target keyword: [keyword]
[One line on how confident you are and why — did the 3 signals agree?]

## Search Console status
- Indexed: yes/no [+ any coverage issue]
- Current position: [X] · Impressions: [X] · Clicks: [X] · CTR: [X]%
- Other queries this page is picking up: [list, if notable]
- What this tells us: [plain-language read — indexing problem? CTR problem? position problem?]

## SERP landscape
| Rank | Domain | What they have that we don't |
|---|---|---|
...

## Recommendations
[Ordered by expected impact. Each one: what to change, why (tie back to a specific GSC
number or a specific competitor gap, not a generic SEO platitude), and how big a lift it is.]
```

Keep language specific to what you actually found — cite the number or the competitor, don't
write generic advice ("add more content", "improve E-E-A-T") that could apply to any page.
Avoid restating Mentiohunt's product pitch or unrelated SEO fundamentals; this is a diagnostic
for one page.

## Step 6: Offer to apply edits

After the report, if a local MDX file was found in Step 1, ask the user whether to apply any
of the recommendations directly (new FAQ entries, a comparison table, a rewritten meta
description, an added section) rather than assuming. Edit only what they confirm — some
recommendations are structural calls (e.g. "add a pricing table") the user may want to write
themselves.

## When GSC or a competitor page won't cooperate

- No GSC data for the URL (too new, zero impressions): say so plainly, skip to SERP-only
  analysis, and note the page needs more time/promotion before GSC data is meaningful.
- A competitor page fails to fetch (paywall, bot-blocked): note it as "outranking us, couldn't
  inspect content" rather than guessing at its content — an unfetchable page is still a data
  point (it's beating this page) even without knowing why.
