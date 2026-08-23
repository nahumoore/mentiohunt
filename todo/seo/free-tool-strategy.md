# Free Tool Strategy — Mentiohunt

_Keyword data: DataForSEO, US/en, Aug 2026. Free tools = high-intent, link-bait, lead-magnet pages. Each should map to the product (opportunity discovery, fit, outreach prep) and pull users toward the queue._

## Existing free tools

`backlink-opportunity-finder` · `backlink-price-calculator` · `competitor-backlink-gap` · `directory-backlink-opportunity-finder` · `google-index-checker` · `startup-directories` · `guest-post-sites-finder`

GSC note: `google-index-checker` gets impressions (105) but ranks pos ~84 — generic index-checker SERP is saturated. Don't add more commodity "checker" tools that don't tie to prospecting.

## Build (low KD, buildable, product-aligned)

Status as of 2026-08-22: every row below is built and shipped except `press-release-generator`, which remains the only open item.

| Slug                                         | Primary keyword            | Vol | KD  | Secondary                                                                      | Why it fits                                                                                                                                       |
| -------------------------------------------- | -------------------------- | --- | --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `free-tools/guest-post-sites-finder` (DONE)  | guest posting sites        | 390 | 3   | guest post sites list (90, KD16)                                               | Best opportunity. Curated/searchable guest-post sites per niche. Pairs with `directory-backlink-opportunity-finder`. Feeds the opportunity queue. |
| `free-tools/backlink-outreach-email-generator` (DONE) | outreach email template    | 170 | 6   | cold email generator (70, KD14) · link building outreach email (50, KD9)       | Product already generates outreach drafts — strongest product CTA of the set.                                                                     |
| `free-tools/anchor-text-generator` (DONE)    | anchor text generator      | 30  | low | —                                                                              | Niche, cheap. Generates varied/safe anchors. Low effort, fills topical gap.                                                                       |
| `free-tools/dofollow-link-checker` (DONE)    | do-follow backlink checker | 320 | 22  | —                                                                              | Dofollow vs nofollow checker for qualifying prospects. GSC as of 2026-08-22 (90d): 3,233 impressions but position ~80 — confirms this doc's own warning that generic "checker" SERPs are saturated. Don't build more commodity checkers on this result. |
| `free-tools/bulk-email-verifier` (DONE)      | bulk email verifier free   | 390 | 19  | free bulk email verifier (390, KD19)                                           | Verify contact emails before sending — direct tie to the scraper's contact-enrichment step. Cleaner fit than a generic email finder.              |
| `free-tools/backlink-monitor` (DONE)         | backlink monitoring tool   | 720 | 36  | backlink monitor tool (720, same SERP)                                         | Ties directly to the paid Link Tracker feature — free single-domain snapshot, upsell to full daily monitoring.                                    |
| `free-tools/press-release-generator`         | press release generator    | 70  | 14  | press release template (4,400, KD14 — informational, template-download intent) | Cheap, template-driven. Loosest product tie of the set (SaaS-launch PR angle) but very low KD for the volume.                                     |

### Priority order

1. ~~**bulk-email-verifier**~~ — done.
2. ~~**backlink-monitor**~~ — done.
3. **press-release-generator** — cheap build, KD14, weakest product tie — the only remaining item, build if capacity allows.

## Bigger bet (not sized yet)

**HARO-style journalist request board** — "haro" itself pulls 18,100 vol at KD18, but that's brand-navigational (people searching for the actual HARO/Qwoted service), not winnable with a tool page. A "free HARO alternative" curated board is a real content-driven acquisition channel for PR/link-building — but it's an ongoing curation product, not a one-shot free tool, so it doesn't belong in the table above. Worth scoping separately if there's appetite.

## Skip — too hard / off-positioning

Dominated by Ahrefs/Moz/Semrush or need an index we don't run:

| Keyword                                                                                       | Vol    | KD    | Reason                                                                    |
| --------------------------------------------------------------------------------------------- | ------ | ----- | ------------------------------------------------------------------------- |
| domain authority checker                                                                      | 12,100 | 72    | Big-tool SERP, needs DA index                                             |
| website authority checker                                                                     | 12,100 | 55    | Same                                                                      |
| da pa checker                                                                                 | 9,900  | 66    | Same                                                                      |
| domain rating checker                                                                         | 1,900  | 32    | Needs DR/backlink index                                                   |
| free backlink checker                                                                         | 2,900  | 81    | Needs full backlink index                                                 |
| email finder tool                                                                             | 5,400  | 50    | Needs email-finding data infra                                            |
| email verifier tool free                                                                      | 880    | 79    | High KD despite decent volume                                             |
| spam score / toxic backlink checker                                                           | 1,600  | 30–48 | Needs a spam-score index; big-tool SERP                                   |
| backlink generator                                                                            | 390    | 27–35 | Spammy intent — conflicts with "no guaranteed links" positioning          |
| broken link finder                                                                            | —      | 78    | High KD, big-tool SERP (Ahrefs/Check My Links own it)                     |
| expired domain finder/checker                                                                 | 90–210 | 35–37 | Gray-hat tactic, off-positioning                                          |
| competitor backlink checker/analysis (all variants)                                           | 40–720 | 49–92 | Overlaps existing `competitor-backlink-gap`; high-vol variants all KD 50+ |
| guest post pitch template/generator, link building email template, backlink outreach template | ≤10    | —     | No measurable volume                                                      |

Checked and confirmed not worth building: guest post finder (10 vol), resource page finder / unlinked mentions finder / free ai backlink generator (no measurable volume), guest blogging variants (all ≤480 vol, informational, overlaps existing guest-post-sites-finder).

## Content opportunity (not a tool)

"link building tools" / "best link building tools" (590 vol, KD15) — a comparison/roundup article, not a build. Worth a listicle piece linking out to the free tools above; not in scope for this doc.

## Build pattern

Each tool page: input → result + **fit rationale / plain-language reasoning** (per UX guidance), then CTA into the queue. Don't present outputs as verified contact intelligence. Don't imply guaranteed links. Tabler icons only.
