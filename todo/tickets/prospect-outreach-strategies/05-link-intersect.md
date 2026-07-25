# Strategy: Link intersect (`link_intersect`)

**Status: Proposal — not actioned**
**Effort: M** (mostly a persistence change) · **Suggested build order: 5th**

## What it finds

Domains that link to **two or more** of the customer's competitors but not to the customer. The classic
"link gap" analysis, run continuously instead of as a one-off audit.

## Why it converts

Linking to one competitor proves a site covers the category. Linking to *several* proves it isn't
exclusive to any one vendor — it's a site that surveys the space, so "you cover Foo and Bar, you're
missing Baz" is a natural, almost obligatory ask. Empirically the strongest prioritisation signal in
link prospecting, and it's a much better ranking axis than `competitor_backlink`'s current
`order_by: ["rank,desc"]`, which optimises for authority rather than for willingness to link.

## What makes this cheap — and the one blocker

The data is **already being paid for**. `competitor_backlink` calls `getBacklinks` per competitor every
run and pages through results with a cursor. But `process-competitor.ts` only persists rows that
*survive filtering and scoring* — as `backlink_prospects`. The raw `url_from`/`url_to` set is discarded.

So intersection can't be computed today, and this ticket is really two changes:

1. **Persist the raw backlink set.** A new table, e.g.
   `competitor_backlinks (product_id, competitor_domain, source_domain, source_url, target_url, anchor, dr, first_seen_at, last_seen_at)`,
   unique on `(product_id, competitor_domain, source_domain)`. Written by `extractBacklinks`'s caller
   as a side effect, cheap (a bulk upsert per run), and immediately useful beyond this strategy —
   ticket 04 wants the same rows, and it makes `competitor_backlink`'s cursor behaviour auditable.
2. **The strategy itself**, which is then almost pure SQL.

Because `getBacklinks` uses `mode: "one_per_domain"`, each run sees one linking page per referring
domain per competitor — exactly the granularity intersection needs. The intersection set therefore
*accumulates* as the cursor advances across runs, which means this strategy gets better the longer a
product has been active. Worth stating in the UI.

## Resources used

| Resource | Where | Status |
|---|---|---|
| DataForSEO backlinks | `helpers/data-for-seo/get-backlinks.ts` | exists |
| Cursor rotation per competitor | `competitor-backlink/prospect-run-tracking.ts` | exists |
| Everything downstream | standard | exists |
| Raw backlink persistence | — | **new table required** |

No new vendor spend at all. This is the highest-leverage strategy per dollar in the set — it monetises
data already being bought and thrown away.

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => {
  if ((product.competitors ?? []).length < 2) return false      // intersection needs 2+
  // and at least one domain seen against 2+ competitors
  return (await countIntersectingDomains(product.id)) > 0
}
```

Requires **2+ competitors**, which is a stricter gate than `competitor_backlink`'s 1+. Also requires
enough accumulated history to have an intersection at all, so it will be un-runnable for the first few
days of a product's life and `selectStrategyForRun` will correctly skip past it.

## Pipeline

1. **Compute the intersection** — from the new table:
   ```sql
   select source_domain, count(distinct competitor_domain) as competitor_count,
          array_agg(distinct competitor_domain) as competitors,
          max(dr) as dr
   from competitor_backlinks
   where product_id = $1
   group by source_domain
   having count(distinct competitor_domain) >= 2
   ```
2. **Subtract sites that already link to us.** Two options: `getBacklinks({ target: ownDomain })` and
   diff (one paid call, authoritative), or trust the absence of the domain in our own backlink set if
   we're already storing it for ticket 02. Prefer the paid call — a false positive here means emailing
   someone who already links to us, which is the worst possible first impression.
3. **Subtract already-stored prospects** for this product, plus `isNoiseDomain` and own domain.
4. **Rank** — by `competitor_count` first, then DR. A domain linking to 3 competitors beats a higher-DR
   domain linking to 2. This ordering *is* the strategy's value; don't collapse it into a DR sort.
5. **Pick the best landing page per domain** — the intersection is domain-level, but outreach needs a
   URL. Use the stored `source_url` whose anchor/context best matches the category, or run one SERP
   `site:domain <category>` query for the most relevant page. Prefer the stored URL in v1 to keep this
   SERP-free.
6. **Fetch + qualify** — `fetchPageContent`, confirm the page is a plausible placement target and that
   the competitor links are editorial (in-content) rather than sitewide footer/sponsor links. A
   footer-wide "our partners" link to two competitors is a paid placement, not an editorial one, and
   pitching it as if it were editorial wastes a send. This is the main qualifier and it needs a real
   LLM pass on the page text.
7. **Site relevance** → **DR filter** → **persist + enrich**. `tier: "link_intersect"`,
   `raw_metadata` carries the competitor list and `competitor_count`.
8. **Alert** — `helpers/emails/send-link-intersect-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "link_intersect"
    title: string
    foundUrl: string
    competitorsLinked: string[]     // 2+ names
    competitorCount: number
  }
```

`buildFraming`: name the competitors they already reference (specific, verifiable, proves the page was
read) and ask about inclusion. The natural framing is "you've covered Foo and Bar — we're in the same
category and I think we'd be useful to the same readers."

Prompt caution: do **not** let the model imply the site is obliged to be balanced, or that omitting the
product is an oversight or bias. That reads as entitled. Keep it as an offer.

## Cost per run

Cheapest per prospect of anything in the set once the table exists — the intersection is a SQL
aggregate, and the only new paid call is the one own-domain backlink fetch in step 2 (cacheable for a
day). Then page fetches and enrichment as usual.

## Rotation / exhaustion notes

Grows rather than exhausts: every `competitor_backlink` run advances the cursor and adds rows, so the
intersection set expands over time. Two consequences —

- it pairs well with `competitor_backlink` in the rotation (that strategy feeds this one);
- early in a product's life it will be empty, so don't interpret initial zeros as failure.

Once the accumulated set is large, this strategy has the best prospect-quality-per-run in the rotation
and arguably deserves a heavier weight than round-robin gives it (see `00-shared-groundwork.md` §3a).

## Open questions

- **Table scope.** Keying `competitor_backlinks` by `product_id` duplicates rows across customers with
  shared competitors. A global `(competitor_domain, source_domain)` table with per-product views would
  be smaller and would let a new customer get an instant intersection from data other customers already
  paid for. That's a meaningfully better product behaviour — new customer, day-one results — but it
  raises a data-sharing question worth deciding deliberately rather than by accident.
- **Threshold of 2.** With 5+ competitors, requiring 3 gives a much stronger signal. Consider making the
  threshold scale with the competitor count rather than fixing it at 2.
- **Retention.** These rows accumulate indefinitely. Needs a `last_seen_at`-based pruning policy, and a
  decision on whether a link that disappears from the competitor's profile should be deleted (it's also
  a signal — ticket 02 in reverse, for a competitor).
- Should intersect **replace** `competitor_backlink`'s ranking rather than being a separate strategy?
  Arguably the intersection count belongs in that strategy's scoring. Kept separate here because the
  email framing is genuinely different, but worth a deliberate decision.
