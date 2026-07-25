# Strategy: Lost link reclaim (`lost_link_reclaim`)

**Status: Proposal — not actioned**
**Effort: S** · **Suggested build order: 2nd**

## What it finds

Sites that **used to link to the customer** and no longer do. The link was removed, the linking page
was deleted or rewritten, a redirect was dropped, or a CMS migration broke it.

## Why it converts better than anything else here

Every other strategy in the rotation asks a stranger for a favour. This one reports a defect:
"you linked to us from *this* page and the link isn't there anymore — was that intentional?" The site
owner already made the editorial decision to link once, and the fix is usually one line. It's also
the only strategy where the customer has a legitimate claim rather than a request.

Secondary benefit: it's the cheapest strategy in the set. One API call, no SERP, no query planning, no
LLM query generation. The qualifier is a page fetch.

## Resources used

| Resource | Where | Status |
|---|---|---|
| Moz Links API — `lost_last_60_days` filter | `helpers/moz/data-site-link-list.ts` | **built, never called** |
| DataForSEO backlinks (alternative source) | `helpers/data-for-seo/get-backlinks.ts` | exists — would need `backlinks_status_type: "lost"` |
| Backlink count precondition | `helpers/data-for-seo/get-backlinks-summary.ts` | exists |
| Page fetch | `listicle-roundup/check-listicle-client.ts` | exists |
| Contact enrichment | `competitor-backlink/enrich-contact.ts` | exists |

`helpers/moz/data-site-link-list.ts` is a complete, documented, unused client. Its header comment even
describes the pagination strategy for a daily job. This strategy is what it was written for.

## Precondition (`isRunnable`)

```ts
isRunnable: async (product) => {
  // has the product ever had backlinks to lose?
  const { referringDomains } = await getBacklinksSummary(domainOf(product.website_url))
  return (referringDomains ?? 0) > 0
}
```

Worth caching this in `products` or a settings column — it's a paid call and it changes slowly. A
brand-new product with zero referring domains will never be runnable, and `selectStrategyForRun`
already handles that gracefully by moving to the next strategy.

## Pipeline

1. **Fetch lost links** —
   ```ts
   dataSiteLinkList({
     site_query: { query: ownDomain, scope: "domain" },
     options: {
       scope: "domain",                                    // one link per source root domain
       sort: "source_domain_authority",
       filters: ["external", "lost_last_60_days"],         // "external" required when combining filters
     },
     offset: { token: savedCursor, limit: 50 },
   })
   ```
2. **Persist the cursor** in `backlink_prospect_runs.metadata` (the pattern
   `competitor-backlink` already uses for its DataForSEO `search_after_token` — see
   `process-competitor.ts:37` / `getLastMozCursor`). When `offset.token` comes back `null`, reset to
   `null`; the 60-day window will have rolled forward by the next run and surface different links.
3. **Verify the loss is real** — Moz's index lags, so a "lost" link is a hypothesis. Fetch
   `source_url` via `fetchPageContent` and branch:
   - page fetches fine, own domain **absent** from the HTML → genuine removal → **qualify**;
   - page fetches fine, own domain **present** → stale Moz data → discard silently (do not insert);
   - page 404s / doesn't resolve → the *page* died, not the link. Different pitch, arguably a
     different opportunity. Simplest v1: discard. See open questions.
4. **Filter noise** — `isNoiseDomain`, own domain, and drop anything already in `backlink_prospects`
   for this product.
5. **Score** — a light relevance pass is still worth running (a lost link from a scraper/aggregator
   isn't worth an email), but the bar can be lower than other strategies since the site already linked
   once. Consider skipping the LLM scorer entirely in v1 and gating on Moz's `spam_score` +
   `source_domain_authority`, which come back in the same response for free.
6. **DR filter** — `settings.dr_min` as usual. Note Moz returns `domain_authority`, not Ahrefs DR;
   don't persist DA into `domain_rating`. Either call `enrichDomainRatings` for the qualified set or
   store DA in `raw_metadata` and leave `domain_rating` null (the competitor strategy has the same
   trap documented at `process-competitor.ts:156-158`).
7. **Persist + enrich** — `tier: "lost_link_reclaim"`, `found_url` = `source_url`,
   `target_url` = the previously-linked page from `target_site_metrics.page`. Put
   `anchor_text`, `date_first_seen`, and `date_disappeared` in `raw_metadata` — the email needs them.
8. **Alert** — `helpers/emails/send-lost-link-alert.ts`.

## Outreach framing

```ts
| {
    opportunityType: "lost_link_reclaim"
    title: string
    foundUrl: string        // the page that used to link
    targetUrl: string       // the page of ours it linked to
    anchorText: string | null
    firstSeen: string | null
    disappearedAt: string | null
  }
```

`buildFraming`: state the specific page and what it linked to, note the link no longer resolves, ask
if it was intentional. **Tone caution** — this must read as a helpful heads-up, not an accusation or
an entitlement claim. Explicit instruction to the model: no "you removed our link", no implication of
obligation, and accept "we changed direction" gracefully. Email 3 should drop the ask entirely rather
than push a third time.

Also: only include the anchor text if we have it, and never assert *why* it disappeared — we don't
know, and guessing wrong ("looks like your migration broke it") in front of a technical founder is
expensive.

## Cost per run

The cheapest strategy in the set. One Moz call per run, ~10–30 page fetches to verify, no SERP, no
query-generation LLM call. Contact enrichment per qualified prospect dominates as always.

## Rotation / exhaustion notes

Self-rotating: the `lost_last_60_days` window rolls forward on its own, so unlike SERP strategies this
one regenerates candidates without any query pool. It will legitimately return zero for long stretches
on products with few backlinks — that's correct behaviour, not exhaustion, but it means the zero-yield
cooldown from `00-shared-groundwork.md` §3b should be tuned not to permanently bench it.

## Open questions

- **Moz vs DataForSEO as the source.** Moz has the purpose-built `lost_last_60_days` filter and the
  client is already written. DataForSEO is already in the billing relationship and supports
  `backlinks_status_type: "lost"`. Decide based on whether `MOZ_TOKEN` is actually provisioned in
  production — worth checking before building, since the client has never run.
- **Dead linking page (404) → separate strategy?** A page that died took our link with it, and the
  pitch is "your old post is gone, want to republish / point the redirect somewhere useful" — closer
  to `broken_link_building` (ticket 04) run in reverse. Keep out of v1.
- **Overlap with `unlinked_mention`.** A page that dropped the link but kept the brand name will also
  surface as an unlinked mention. Dedupe is by `found_url` within a product, so whichever strategy
  runs first wins and the other skips it — acceptable, but the tier assignment then depends on
  rotation order, which is arbitrary. Worth deciding whether reclaim should win (better framing) and
  if so, checking for an existing `unlinked_mention` row and upgrading it.
