# Prospect outreach strategies — proposal set

One file per candidate discovery strategy for `apps/server/src/jobs/daily-backlink-discovery.ts`.
All of these are **proposals, not decisions** — nothing here has been actioned.

Written 2026-07-24 after an audit of what discovery resources the repo already has wired up.

## Why this folder exists

The daily job currently rotates 4 strategies (`ROTATION_STRATEGIES`, `daily-backlink-discovery.ts:27`):
`competitor_backlink`, `unlinked_mention`, `listicle_roundup`, `resource_page_inclusion`.

The audit turned up three things:

1. **Two discovery methods are fully built but only exposed as public free tools**, never wired into
   the rotation — `methods/guest-post-sites/` and `methods/directories/`.
2. **Three integrations are built and never called at all** — the Moz Links API client
   (`helpers/moz/data-site-link-list.ts`), the email verifier actor
   (`helpers/actors/email-verifier.ts`), and `getBulkTrafficEstimation` outside of
   `analyze-backlink-site`.
3. **The four existing strategies use ~20% of what the SERP scraper + DataForSEO + `product_pages`
   can express.** Several high-reply-rate link building plays need no new vendor, only new query
   plans and qualifiers.

## Read order

`00-shared-groundwork.md` first — it covers the per-strategy boilerplate every ticket below assumes
(enum migration, web config sync, alert email, the copy-pasted insert/enrich tail, and the rotation
starvation problem that gets worse with each strategy added).

Then, in suggested build order:

| # | Strategy | Tier value | Effort | Core resource |
|---|---|---|---|---|
| 01 | [Guest post pitch](01-guest-post-pitch.md) | `guest_post_pitch` | S | already-built `methods/guest-post-sites/` |
| 02 | [Lost link reclaim](02-lost-link-reclaim.md) | `lost_link_reclaim` | S | Moz `lost_last_60_days` (unused client) |
| 03 | [Competitor alternatives page](03-competitor-alternatives-page.md) | `competitor_alternatives_page` | S | SERP + `competitors` |
| 04 | [Broken link building](04-broken-link-building.md) | `broken_link_building` | M | DataForSEO + `fetchWithRetry` + `product_pages` |
| 05 | [Link intersect](05-link-intersect.md) | `link_intersect` | M | DataForSEO data already paid for |
| 06 | [Fresh competitor links](06-fresh-competitor-links.md) | `fresh_competitor_links` | S | Moz `gained_last_60_days` |
| 07 | [Stale listicle refresh](07-stale-listicle-refresh.md) | `stale_listicle_refresh` | S | SERP year operators |
| 08 | [Integration ecosystem](08-integration-ecosystem.md) | `integration_ecosystem` | M | `product_pages` + new LLM derivation |
| 09 | [Testimonial exchange](09-testimonial-exchange.md) | `testimonial_exchange` | M | `product_pages` + new LLM derivation |
| 10 | [Author repeat linker](10-author-repeat-linker.md) | `author_repeat_linker` | L | scraper bylines + SERP |
| 11 | [Directory gap submission](11-directory-gap-submission.md) | `directory_gap` | M | already-built `methods/directories/` |

Effort is discovery-and-qualify work only; every one of them also carries the
`00-shared-groundwork.md` boilerplate.

## Deliberately excluded

- **Anything social.** `helpers/actors/tweet-scraper.ts` exists and would technically support
  #journorequest-style discovery, but CLAUDE.md rules out community monitoring and social reply
  automation. Not proposed.
- **Blog comment / forum link drops.** Spam, and incompatible with the positioning.
- **Paid placement / sponsored post discovery.** Would need a fundamentally different opportunity
  shape (budget, invoicing) and muddies "more transparent than an agency".

## Sequencing recommendation

01 → 02 → 03, then **stop and do the shared extraction in `00-shared-groundwork.md`** before 04–11.
The insert/enrich tail is already duplicated 4 times; adding 11 more copies of it is the real cost
here, not the discovery logic.
