# Listicle roundup: competitor queries search the literal domain string, not the brand name

## Effort: XS-S — 1 file, ~20-30 min (needs a small new helper, none exists yet)

## Background

`listicle_roundup` found 36 prospects over its last 8 runs for Mentiohunt but inconsistently (0, 0, 10, 4, 5, 5, 9, 3) — two early zero runs, then it picked up. Audited the query construction for a zero-cost way to raise the hit rate on the queries already being run.

## Root cause

`build-listicle-queries.ts:109-113` builds one query per competitor:

```ts
for (const competitor of product.competitors ?? []) {
  const domain = extractCompetitorDomain(competitor)
  if (!domain || domain === ownDomain) continue
  queries.add(`"${domain}" alternatives -site:${ownDomain}`)
}
```

For Mentiohunt's 9 competitors this produces queries like `"pitchbox.com" alternatives`. Listicle posts almost always write the brand name — "Pitchbox alternatives" — not the bare domain with `.com` as an exact-quoted phrase. This exact-phrase-on-FQDN query likely misses most real "best X alternatives" hits across all 9 competitor queries, which is otherwise the most deterministic, highest-signal part of this method's query pool (unlike the LLM-generated category queries, competitor names are known and stable).

Confirmed no existing helper derives a brand name from a domain anywhere in `apps/server/src` — this needs a small new utility.

## Fix

Add a small helper (strip TLD, replace hyphens/dots with spaces, title-case) to turn `pitchbox.com` → `Pitchbox`, and use that in the query template instead of the raw domain: `` `"${brandName}" alternatives -site:${ownDomain}` ``. Same 9 queries, same cost, better phrasing.

## Also worth doing while in this file (lower priority, same zero-cost bar)

The 3-5 LLM-derived category queries (`index.ts:53`) are regenerated fresh, non-cached, on every single run — a non-deterministic LLM call each time. `selectQueriesForRun`'s staleness tracking dedupes by exact query string, so slightly different LLM phrasing between runs makes "already-run" category queries look brand-new, silently breaking the intended rotation (documented in `build-listicle-queries.ts:44-52`'s own header comment). Caching the category list per product (regenerate every N days instead of every run) would fix the staleness tracking *and* remove a redundant LLM call rather than adding one. Also consider prioritizing the 9 deterministic competitor-alternative queries ahead of the category variants in `selectQueriesForRun`, since they don't suffer from the string-drift problem — pure reordering of already-planned queries.

Not required to land the domain/brand-name fix above; revisit once that fix has run history to compare against.
