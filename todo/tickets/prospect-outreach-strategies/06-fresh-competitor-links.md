# Strategy: Fresh competitor links (`fresh_competitor_links`)

**Status: Proposal — not actioned**
**Effort: S** · **Suggested build order: 6th**

## What it finds

Sites that started linking to a competitor **in the last 60 days**. Same data source as
`competitor_backlink`, sorted on recency instead of authority.

## Why it converts

Two distinct advantages over the existing competitor strategy:

1. **Proven current activity.** A site that published a competitor link last month is actively editing
   content in this category right now. `competitor_backlink`'s `order_by: ["rank,desc"]` surfaces
   high-authority links that may be five years old, on pages nobody has touched since — high DR, low
   probability anyone reads the email or edits the page.
2. **A timing hook.** "Saw you recently added Foo to your comparison" is specific, verifiable and
   naturally timed. Every other strategy's opening line has to manufacture a reason for reaching out
   today.

## How it differs from `competitor_backlink`

Same competitor set, same underlying link graph, different axis and different vendor:

| | `competitor_backlink` | this |
|---|---|---|
| Source | DataForSEO `backlinks/backlinks/live` | Moz `data.site.link.list` |
| Sort | `rank,desc` (authority) | recency window |
| Pagination | `search_after_token` cursor | rolling 60-day window + `offset.token` |
| Exhaustion | cursor eventually runs out | window rolls forward, self-renewing |

The candidate sets overlap only where a recent link is also a top-authority link. Dedupe by
`found_url` handles the rest.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Moz `gained_last_60_days` filter | `helpers/moz/data-site-link-list.ts` | **built, never called** |
| Competitor rotation | `competitor-backlink/prospect-run-tracking.ts` (`selectCompetitorsForRun`) | exists |
| Everything downstream | standard | exists |

Shares the Moz client with ticket 02, so whichever ships first pays the "does `MOZ_TOKEN` actually work
in production" cost. Build these two together if possible.

## Precondition (`isRunnable`)

```ts
isRunnable: (product) => (product.competitors ?? []).length > 0
```

Same as `competitor_backlink`.

## Pipeline

1. **Select competitors for the run** — `selectCompetitorsForRun(product.id, domains, 2-3)`, but under
   this strategy's own key so it doesn't share rotation state with `competitor_backlink`.
2. **Fetch recent links** per competitor:
   ```ts
   dataSiteLinkList({
     site_query: { query: competitorDomain, scope: "domain" },
     options: {
       scope: "domain",
       sort: "source_domain_authority",
       filters: ["external", "follow", "gained_last_60_days", "not_deleted"],
     },
     offset: { token: savedCursor, limit: 50 },
   })
   ```
   Note `scope: "domain"` on both the query and the options — one link per source root domain, which is
   the granularity we want for prospecting.
3. **Persist the cursor** per `(strategy, competitorDomain)` in `backlink_prospect_runs.metadata`,
   same pattern as `process-competitor.ts:37`. Reset to `null` when `offset.token` comes back `null`;
   the window will have rolled by the next run.
4. **Filter on Moz's own metrics before spending anything** — the response carries `spam_score`,
   `link_propensity`, `domain_authority` and `root_domains_to_root_domain` per source for free. Drop
   high-spam and near-zero-authority sources here rather than paying to fetch and score them. This is
   a real advantage over the DataForSEO path, which returns less per item.
5. **Filter noise + already-stored**, as everywhere else.
6. **Fetch + qualify** — `fetchPageContent`, then score: is this an editorial page where the product
   could plausibly be added alongside the competitor, and is the competitor link in-content rather than
   a sitewide/footer/sponsor placement? Reuse the `PageType` classification vocabulary from
   `competitor-backlink/score-backlink-relevance.ts` (`roundup` / `comparison` / `resource` /
   `brand-mention`) so the existing `buildAngle` logic in `generate-outreach-sequence.ts:73` applies
   unchanged.
7. **DR handling** — Moz gives `domain_authority`, Ahrefs gives DR, and `settings.dr_min` is expressed
   in DR terms. Don't conflate them: call `enrichDomainRatings` for the qualified set when
   `dr_min > 0`, and keep DA in `raw_metadata`. Same trap already documented at
   `process-competitor.ts:156-158`.
8. **Persist + enrich** — `tier: "fresh_competitor_links"`. Put `date_first_seen` and `anchor_text` in
   `raw_metadata`; the email needs the date to justify "recently".
9. **Alert** — `helpers/emails/send-fresh-competitor-links-alert.ts`.

## Outreach framing

Can largely reuse the `competitor_backlink` framing (`pageType` + `competitorDomain` + `anchor`), with
one addition — a recency signal:

```ts
| {
    opportunityType: "fresh_competitor_links"
    title: string
    anchor: string
    pageType: PageType
    competitorDomain: string
    firstSeenAt: string | null    // Moz date_first_seen
  }
```

`buildFraming`: reuse `buildAngle(pageType, competitorDomain)` and prepend the timing hook. Two prompt
cautions:

- **Don't state a precise date.** Moz's `date_first_seen` is when *Moz* first crawled the link, not
  when it was published. "Recently" is safe; "on March 3rd" is a claim we can't support, and being
  wrong about it in front of the person who wrote the page destroys the email's credibility.
- Don't imply we monitor the competitor's backlinks — accurate, but it reads as surveillance. Frame it
  as having come across the page.

## Cost per run

Very cheap: 2–3 Moz calls, then step 4 filters the set down before any fetching, so page fetches and
enrichment are lower-volume than the DataForSEO path. No SERP, no query planning.

## Rotation / exhaustion notes

Self-renewing — the 60-day window rolls forward continuously, so unlike `competitor_backlink` there's
no terminal cursor exhaustion. Yield tracks how much link-building the competitors are actually doing,
so it'll be lumpy: near-zero for a sleepy competitor, rich for one running an active campaign. That
lumpiness is real signal and arguably worth surfacing to the customer ("Foo picked up 14 new links
this month") — but that's a dashboard feature, not this ticket.

## Open questions

- **Is this distinct enough from `competitor_backlink` to be its own tier?** Alternative: keep one
  competitor strategy and alternate its *sort axis* run to run (authority one day, recency the next),
  which avoids an enum value and a config entry. Downside: the queue then can't tell the customer why a
  prospect surfaced, and the timing hook in the email would have to be conditional. Lean toward a
  separate tier for explainability, but it's a genuine call.
- **Moz vs DataForSEO for recency.** DataForSEO's backlinks endpoint supports date filters too; using
  it would avoid a second vendor entirely. Moz's advantage is the free per-source spam/propensity
  metrics in step 4. Worth a cost comparison before committing, especially given `MOZ_TOKEN` has never
  been exercised in production.
- 60 days is Moz's fixed window — there's no 30-day variant. For a competitor with heavy link velocity
  the window may return more than a run can process; the `sort` + `limit: 50` + cursor combination
  handles that, but confirm the ordering is stable across paginated calls.
