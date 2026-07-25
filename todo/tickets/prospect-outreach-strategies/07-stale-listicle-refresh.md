# Strategy: Stale listicle refresh (`stale_listicle_refresh`)

**Status: Proposal — not actioned**
**Effort: S** · **Suggested build order: 7th**

## What it finds

Category listicles and roundups that are **visibly out of date** — a prior year in the title or URL, a
stale "last updated" line, dead vendors in the list — but still ranking. Then pitches inclusion as part
of a refresh.

## Why it converts

`listicle_roundup` asks "please add us". This asks "this post is due a refresh, here's what changed in
the category, and we'd be one of the additions." That's a materially better email for two reasons:

1. **A stale ranking page is a problem the owner already knows they have.** Being told which parts are
   out of date is useful even if they ignore the inclusion ask.
2. **It creates a reason to edit the page at all.** The most common silent failure of listicle outreach
   isn't "no", it's that nobody was planning to touch that post. A refresh prompt supplies the occasion.

The strongest version of the email names something concretely wrong — a listed tool that shut down,
renamed, or was acquired. That's checkable and it's the sentence that gets a reply.

## How it differs from `listicle_roundup`

Same page type, opposite selection criterion. `listicle_roundup`'s scorer explicitly qualifies pages as
"genuine, current listicles" — this strategy wants the ones that *fail* that freshness check, which the
existing pipeline discards today. Everything else (SERP → fetch → score → enrich) is shared.

That makes it the cheapest new tier to build in the whole set: a different query pool and an inverted
qualifier over machinery that already exists in `listicle-roundup/`.

## Resources used

| Resource | Where | Status |
|---|---|---|
| SERP scraper with year/`intitle:` operators | `helpers/actors/google-serp-scraper.ts` | exists |
| Listicle query builder | `listicle-roundup/build-listicle-queries.ts` | exists — extend, don't duplicate |
| Page fetch | `listicle-roundup/check-listicle-client.ts` | exists |
| Everything downstream | standard | exists |

## Precondition (`isRunnable`)

```ts
isRunnable: (product) => (product.product_name?.trim() ?? "") !== ""
```

Same as `listicle_roundup`.

## Pipeline

1. **Build the query pool** — take the category phrases `build-listicle-queries.ts` already derives and
   cross them with staleness footprints. The year values must be **computed from the current date**, not
   hardcoded, or the strategy silently rots:
   - `best {category} tools {lastYear}`
   - `top {category} software {twoYearsAgo}`
   - `intitle:"{category}" intitle:{lastYear}`
   - `best {category} tools -{currentYear}` (excludes posts already refreshed this year)
   - `"{category} tools" "updated {lastYear}"`

   Note `after:`/`before:` Google operators filter by *publish* date and are unreliable on listicles
   that get silently re-dated; title-year matching is the more honest signal.
2. **Rotate the pool** via `selectQueriesForRun` — same as `listicle_roundup`.
3. **SERP** — `limit: "50"`, `pLimit(3)`.
4. **Dedupe by URL**, drop own domain / noise / already-stored (step-2b pattern).
5. **Fetch + qualify — this is the whole strategy.** A new scorer over the page text that must return:
   - `isStale` + evidence: prior year in title/URL/body, a "last updated" older than ~12 months, or
     copyright/date signals;
   - `isGenuineListicle` (still needed — same check as `listicle_roundup`, we don't want stale blog
     posts *about* tools);
   - `productAbsent`;
   - **`staleEvidence: string[]`** — the specific findings the email will cite. Prompt it to look for
     listed vendors that no longer exist, sunset products, and old pricing claims. This field is what
     makes the email good; without it the pitch collapses back into `listicle_roundup`.
   - Keep pages where `isStale && isGenuineListicle && productAbsent`, score ≥ 3.
6. **DR filter** → **site relevance** → **persist + enrich**. `tier: "stale_listicle_refresh"`,
   `raw_metadata` carries `staleEvidence` and the detected year so the queue can show *why* it's stale.
7. **Alert** — `helpers/emails/send-stale-listicle-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "stale_listicle_refresh"
    title: string
    foundUrl: string
    detectedYear: string | null
    staleEvidence: string[]      // "lists Foo, which shut down in 2025"
  }
```

`buildFraming`: open with the concrete staleness finding — not "I noticed your post is from 2024", which
is obvious and mildly rude, but the substantive version ("the post still lists Foo, which shut down last
year"). Then the inclusion ask, framed as one of several things worth updating.

Prompt cautions:

- **Never assert a vendor is dead unless `staleEvidence` says so.** The LLM will happily invent
  acquisitions. Only claims present in `staleEvidence` may appear in the email — same discipline as the
  existing "do not invent offers" rule (`generate-outreach-sequence.ts:157`).
- No condescension about the page being neglected. The recipient is often a solo founder or a
  one-person content team.
- Email 2 is a natural place to offer something genuinely useful for the refresh (current pricing, a
  screenshot, a short quote) if `settings.offering` supports it.

## Cost per run

Same profile as `listicle_roundup` — ~4–6 SERP calls, ~25 fetches, 2 LLM batches, plus enrichment. The
qualifier prompt is longer (needs to extract evidence), so slightly more tokens per scored page.

## Rotation / exhaustion notes

The year-based pool renews itself annually, and shifting year windows keeps surfacing different pages,
but within a given year the SERPs are as stable as `listicle_roundup`'s. Expect similar exhaustion
behaviour and the same need for the zero-yield cooldown.

One nice property: pages that *were* refreshed after our email drop out of the stale pool and become
eligible for `listicle_roundup` instead. No special handling needed — the freshness check does it.

## Open questions

- **Separate tier, or a query-plan variant of `listicle_roundup`?** Strong case for the latter: same
  page type, same pipeline, and the only real difference is the qualifier's freshness branch plus the
  email framing. Making it a variant avoids an enum value, a config entry and an alert email, at the
  cost of the queue no longer being able to explain why a page surfaced. Given that CLAUDE.md wants
  every opportunity to carry a plain-language rationale, and the rationale here is genuinely different,
  a separate tier is probably right — but this is the ticket where merging is most defensible.
- **Year detection from `product_pages`-independent context.** The current date has to come from the
  job, and any test fixture must inject it rather than reading the clock, or the query pool changes
  under the tests every January.
- Some stale listicles are stale because the site is abandoned. Consider a signal for "has this site
  published anything in the last 12 months" before spending enrichment on it — a `site:domain` SERP
  query with a recency filter would answer it for one extra call per domain, and abandoned sites are the
  main source of wasted sends here.
