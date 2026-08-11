---
name: keyword-research
description: Use when the user wants keyword research, topic clustering, or an SEO strategy. This skill uses the Apify Google Keywords Suggest Scraper Pro actor to expand seed terms into long-tail opportunities and turn them into a practical strategy.
compatibility: opencode
metadata:
  provider: apify
  actor: crawlerbros/google-keywords-suggest-scraper-pro
  workflow: seed-to-cluster seo strategy
---

# Keyword Research

Use this skill when the user wants to generate an SEO strategy, keyword research report, topic clusters, long-tail keyword ideas, or market-specific search demand exploration.

This skill does not rely on guesses or static keyword lists. Investigate and run the Apify actor with `curl`, then convert the output into a practical strategy the user can act on.

## Tooling Requirement

- Use the Apify actor `https://apify.com/crawlerbros/google-keywords-suggest-scraper-pro`.
- Use `curl` for investigation and execution.
- Use the `APIFY_API_KEY` environment variable when calling Apify. Read it from the shell env; never hardcode it.

## Pricing And Spend Limit

Based on the actor metadata at the time this skill was written:

- Actor start: `$0.005` per GB when the actor starts
- Result item: `$0.002` per dataset item on the free tier

Treat pricing as subject to change on Apify, but use these values for planning unless a fresh `curl` check shows otherwise.

Hard rule:

- If a planned run is likely to cost more than `$0.50`, stop and ask the user before running it.
- If you need another pass and the next pass would push total expected spend over `$0.50`, ask the user before proceeding.
- Prefer smaller exploratory runs first so you can stay under the threshold.

Practical guidance:

- Estimate cost mainly from expected result count.
- At `$0.002` per result, `$0.50` is about `250` result items, plus a small actor start charge.
- Default to a narrower seed set or lower `maxItemsPerKeyword` when a broad run risks crossing the threshold.

## What The Actor Supports

The actor expands seed keywords from Google Suggest and supports these useful inputs:

- `keywords`: array of seed keywords
- `mode`: `exact`, `all`, `questions`, `prepositions`, `comparisons`, `alphabet`
- `country`: Google market code like `US`, `GB`, `DE`, `IN`, `BR`, or `ALL`
- `language`: Google language code like `en`, `es`, `fr`, `de`, `ja`, `zh-CN`
- `maxItemsPerKeyword`: cap per seed, default is 200 according to the actor page
- `minLength`
- `maxLength`
- `containsKeyword`

Prefer `mode: "all"` for broad discovery, then narrow with `questions`, `prepositions`, or `comparisons` when the user needs intent-specific angles.

## Default Workflow

1. Read the user request and identify:
   - product or site
   - target customer
   - geography
   - language
   - main topics or seed terms
   - whether the user wants content SEO, landing pages, comparison pages, or a full strategy
2. If seeds are missing, derive a small starter list from the user context before asking for more.
3. Investigate the actor with `curl` if needed before running it.
4. Run the actor with `curl` using a focused first pass.
5. Group results into keyword themes and intent buckets.
6. Turn those buckets into a strategy with priorities, page types, and next actions.

## Investigation Commands

Use `curl` to inspect the actor metadata when needed:

```bash
curl -s "https://api.apify.com/v2/acts/crawlerbros~google-keywords-suggest-scraper-pro?token=${APIFY_API_KEY}"
```

The actor page also documents supported fields such as `keywords`, `mode`, `country`, `language`, and `maxItemsPerKeyword`.

## Run Commands

Use `run-sync-get-dataset-items` when you want the result rows directly back from the API.

Broad discovery example:

```bash
curl -s -X POST \
  "https://api.apify.com/v2/acts/crawlerbros~google-keywords-suggest-scraper-pro/run-sync-get-dataset-items?token=${APIFY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["seo strategy", "keyword research", "backlink outreach"],
    "mode": "all",
    "country": "US",
    "language": "en",
    "maxItemsPerKeyword": 100
  }'
```

Question-focused content discovery example:

```bash
curl -s -X POST \
  "https://api.apify.com/v2/acts/crawlerbros~google-keywords-suggest-scraper-pro/run-sync-get-dataset-items?token=${APIFY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["founder marketing", "link building for saas"],
    "mode": "questions",
    "country": "US",
    "language": "en",
    "maxItemsPerKeyword": 80
  }'
```

Comparison-page discovery example:

```bash
curl -s -X POST \
  "https://api.apify.com/v2/acts/crawlerbros~google-keywords-suggest-scraper-pro/run-sync-get-dataset-items?token=${APIFY_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "keywords": ["ahrefs alternative", "semrush alternative"],
    "mode": "comparisons",
    "country": "US",
    "language": "en",
    "maxItemsPerKeyword": 60
  }'
```

## Strategy Rules

- Do not stop at listing keywords.
- Convert the output into decisions:
  - which themes deserve dedicated pages
  - which themes belong in one cluster
  - which keywords imply comparison intent
  - which keywords imply problem-aware blog content
  - which keywords imply commercial landing pages
- Separate branded, competitor, informational, comparison, and transactional patterns.
- Highlight repeated modifiers such as `best`, `tool`, `software`, `template`, `vs`, `alternative`, `how`, `what`, `for`, and industry-specific qualifiers.
- Call out geo or language differences when the user cares about a market outside the US.

## Output Format

When the user asks for an SEO strategy, structure the response like this:

```md
# SEO Keyword Strategy: <topic or site>

## Brief

- Market: <country/language>
- Goal: <traffic, signups, product awareness, backlinks, etc.>
- Seed set: <seed keywords used>
- Research modes used: <all/questions/comparisons/etc.>

## Priority Themes

| Theme | Intent | Example keywords | Recommended page type | Priority |
| ----- | ------ | ---------------- | --------------------- | -------- |

## Cluster Recommendations

1. <cluster name>
2. <cluster name>

## Quick Wins

- <low-effort, high-signal opportunities>

## Strategic Bets

- <higher-effort themes worth building around>

## Content Or Page Plan

1. <page title or topic>
2. <page title or topic>

## Notes And Caveats

- Google Suggest is directional demand research, not exact search volume.
- Suggestions show language and intent patterns, not guaranteed traffic.
```

## Interpretation Guidance

- Treat Google Suggest as directional demand and phrasing data.
- Do not claim search volume unless another source provides it.
- Do not invent difficulty, CPC, or traffic estimates.
- If the result set is noisy, say so and narrow the next pass with better seeds, a different mode, or a filter.
- If the user wants a full strategy, recommend a second pass for the most promising themes instead of one huge undifferentiated run.

## DataForSEO Fallback (no Apify key, or need volume/difficulty numbers)

If `APIFY_API_KEY` is unset, or the user needs real search volume / organic ranking
difficulty rather than just Google Suggest phrasing, use the DataForSEO MCP tools
(`mcp__*__dataforseo_labs_*`, `mcp__*__kw_data_*`) instead. Getting the right field matters —
DataForSEO exposes two unrelated "competition" numbers and mixing them up produces a wrong
call on how hard a keyword is to rank for organically:

- **Organic ranking difficulty** — use `dataforseo_labs_bulk_keyword_difficulty`
  (`keyword_difficulty`, 0-100 log scale) or `dataforseo_labs_google_keyword_overview`. This is
  what "low/high competition for SEO" means. Use this, and only this, when deciding whether a
  keyword is realistically winnable organically.
- **PPC advertiser competition** — `kw_data_google_ads_search_volume` and
  `dataforseo_labs_google_keyword_ideas` return `competition` / `competition_level` /
  `competition_index`. This measures how many advertisers bid on the term in Google Ads. It
  says nothing about organic ranking difficulty and must never be reported as "SEO
  competition" or used to call a keyword a "quick win."
- Even a low `keyword_difficulty` score can be misleading against big-brand domains: KD is
  computed mostly from backlinks to the *specific ranking URL*, not domain-wide authority — a
  DR 90 site's blog post can rank with a low individual KD score. When the live SERP (see
  `serp-rank-optimizer` or a `WebSearch`) is dominated by high-authority domains, say so
  explicitly alongside the KD number rather than calling the keyword "low competition" on the
  KD score alone.
- When reporting on a keyword, always name which metric backs a competition claim (e.g.
  "KD 13 (organic)" vs "competition: LOW (PPC, not relevant here)") so it's never ambiguous
  which one is being used.

## Mentiohunt Context

For Mentiohunt-adjacent strategy work, prefer themes around:

- backlink outreach workflows
- link prospecting and qualified outreach opportunities
- competitor backlinks and mention opportunities
- founder-led SEO and distribution workflows

Keep the language practical. The point is to help the user decide what to build next, not to dump raw autocomplete suggestions.
