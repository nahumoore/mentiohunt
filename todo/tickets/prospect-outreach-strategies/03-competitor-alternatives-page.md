# Strategy: Competitor alternatives page (`competitor_alternatives_page`)

**Status: Proposal — not actioned**
**Effort: S** · **Suggested build order: 3rd**

## What it finds

Pages built specifically to enumerate alternatives to a named competitor — "10 best Foo alternatives",
"Foo vs Bar vs Baz", "Foo alternatives for small teams" — that name the competitor but **not** the
customer's product.

## Why it converts

Highest-intent variant of the listicle play. The author has already committed to publishing a list of
vendors in this exact category, so the pitch isn't "consider covering tools like ours", it's "you
listed 8 alternatives to Foo and missed one". The editorial decision is already made; the ask is
additive and low-effort.

It also produces the most useful placement for the customer. These pages capture bottom-of-funnel
search intent — someone searching "Foo alternatives" is actively shopping — so the link carries
referral traffic, not just authority. That's a fit rationale worth surfacing in the UI per CLAUDE.md
("expected SEO value", plain-language reasoning).

## How it differs from `listicle_roundup`

`listicle_roundup` builds queries from the product's own category via `build-listicle-queries.ts` —
"best project management tools". This strategy anchors on **competitor names** from
`products.competitors`, which:

- reaches a different SERP neighbourhood (competitor-branded queries, not category queries);
- gives a stronger qualifier — competitor named + product absent is a much cleaner signal than
  "is this a genuine listicle";
- gives a stronger email — "you cover Foo, here's the one you're missing" beats "add us to your list".

Some URL overlap with `listicle_roundup` is expected and harmless: dedupe by `found_url` in step 4
means whichever strategy reaches a page first keeps it.

## Resources used

| Resource | Where | Status |
|---|---|---|
| SERP scraper | `helpers/actors/google-serp-scraper.ts` | exists |
| Page fetch | `listicle-roundup/check-listicle-client.ts` | exists |
| Competitor domain normalization | `competitor-backlink/extract-backlinks.ts` (`extractCompetitorDomain`) | exists |
| Site relevance + DR + enrichment | `shared/*`, `competitor-backlink/enrich-contact.ts` | exists |

No new vendor, no new integration. This is a query plan plus a qualifier.

## Precondition (`isRunnable`)

```ts
isRunnable: (product) => (product.competitors ?? []).length > 0
```

Identical to `competitor_backlink`, so it costs nothing to gate — products without competitors already
skip that strategy today.

Note the input is competitor **names**, not domains. `products.competitors` holds URLs; a query needs
"Foo", not "foo.com". Derive a display name per competitor (LLM one-liner, or strip the TLD and
title-case as a fallback) and cache it — probably on `products` or in the run `input` so it isn't
re-derived daily.

## Pipeline

1. **Build the query pool** — per competitor name:
   - `"{competitor} alternatives"`
   - `"best {competitor} alternatives"`
   - `"{competitor} alternatives for {niche}"`
   - `"{competitor} vs"`
   - `"top {competitor} competitors"`
   - `intitle:"{competitor} alternatives"`

   With 3 competitors that's an 18-query pool — deeper than `listicle_roundup`'s and it grows with the
   customer's competitor list. Rotate via `selectQueriesForRun` (copy
   `listicle-roundup/prospect-run-tracking.ts`), ~4–6 queries per run.
2. **SERP** — `limit: "50"`, `pLimit(3)`, same call shape as `listicle-roundup/index.ts:74-89`.
3. **Dedupe by URL**, drop own domain, `isNoiseDomain`, and — importantly — **drop the competitors'
   own domains**. `"Foo alternatives"` reliably surfaces `foo.com/alternatives`, and pitching a
   competitor's own comparison page is a bad look. Also drop the big review aggregators (G2, Capterra,
   TrustRadius) — check whether `isNoiseDomain` already covers them; if not, this strategy needs them
   added, since they dominate these SERPs and never accept outreach.
4. **Drop already-stored URLs** before fetching (step-2b pattern, `listicle-roundup/index.ts:121-129`).
5. **Fetch + qualify** — `fetchPageContent`, then a scorer confirming:
   - the page actually enumerates alternatives/competitors (≥3 named vendors), not a single-product
     review or the competitor's own marketing page;
   - the named competitor appears;
   - the customer's product does **not** appear (if it does, it's a different opportunity — possibly an
     unlinked mention; see open questions);
   - the page looks maintained (has a date, or a "last updated", or no dead years in the title);
   - return the list of vendors found, so the email can reference the actual list.
6. **DR filter** → **site relevance** → **persist + enrich**, standard tail. `tier:
   "competitor_alternatives_page"`, `found_url` = the page, `target_url` = `product.website_url`.
   `raw_metadata` should carry the anchor competitor, the vendors found, and the relevance reason.
7. **Alert** — `helpers/emails/send-alternatives-page-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "competitor_alternatives_page"
    title: string
    foundUrl: string
    competitorName: string
    vendorsListed: string[]     // what the page already covers
    differentiator: string | null  // from settings.offering, if set
  }
```

`buildFraming`: reference the specific list, name 1–2 vendors on it to prove the page was actually
read, then state in one concrete sentence how the product differs from the competitor the page is
anchored on. This is the one strategy where a differentiation claim is genuinely expected by the
recipient — but per CLAUDE.md, it must come from `backlink_prospects_settings.offering` /
`product_description` and never be invented. The existing prompt already forbids inventing claims
(`generate-outreach-sequence.ts:157`); keep that.

Email 2 angle: offer a free account so they can evaluate it themselves — the standard, and effective,
ask for this page type. Only if `offering` supports it.

## Cost per run

Same profile as `listicle_roundup`: ~4–6 SERP calls at `limit: "50"`, ~25 page fetches, 2 LLM scoring
batches, plus contact enrichment per qualified prospect.

## Rotation / exhaustion notes

Better depth than `listicle_roundup` because the pool scales with the competitor list, and because
`"{competitor} alternatives"` SERPs churn more than category SERPs (new comparison content gets
published constantly in competitive B2B categories). Adding a competitor in onboarding instantly adds
6 fresh queries, which is a nice property: it makes "add your competitors" a visibly rewarded action,
supporting the empty-state guidance in CLAUDE.md.

## Open questions

- **Product already listed → what then?** If the qualifier finds the product on the page, that's
  either a win already banked or an unlinked mention (listed but not linked). Cheapest handling:
  when the product is named but our domain isn't linked, hand it to the `unlinked_mention` path
  instead of discarding. Worth doing in v1 — it's nearly free and those are the best prospects on the
  page.
- **Aggregator blocklist.** Confirm what `shared/url-filters.ts` `isNoiseDomain` currently excludes
  before building; this strategy is unusually sensitive to it.
- **Competitor name derivation** needs to be right — "monday.com alternatives" vs "Monday alternatives"
  return meaningfully different SERPs. Probably an LLM call at competitor-add time, stored, not a
  daily derivation.
