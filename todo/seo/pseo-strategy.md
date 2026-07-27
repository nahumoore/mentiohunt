# Programmatic SEO — Mentiohunt

_Last validated: 2026-07-25 (DataForSEO Labs US/en + live SERP checks). Original research: 2026-07-21._

## What this actually is

Two page templates, each spun into multiple URLs from one layout:

- **Template A** — `/link-building-for/[niche]` — landing pages for "link building for lawyers", "link building for saas", etc. Audience: someone Googling for a link-building approach/agency in their specific industry.
- **Template B** — `/outreach-templates/[type]` — landing pages for outreach email templates by scenario (guest post, broken link, backlink request). Same cluster as the blog-post plan in [outreach-email-content-cluster.md](outreach-email-content-cluster.md) — **these are not the same thing**. Template B here = a tool/landing page ("generate your blogger outreach email"). The other doc = blog articles ("how to write a broken-link outreach email"). Decide per-keyword which format wins before building both — don't ship a landing page and a blog post targeting the identical query.

## Verdict: worth building, but only part of it

Yes, build this — cheap pages, real (if small) search volume, no big platform risk. But the original doc mixed genuinely-easy pages with two pages that are harder than the KD score suggested. Re-checked live SERPs for the two flagship claims:

- **"link building for saas"** — still winnable, but **not as clean as the July 21 note claimed**. Live SERP now includes `wix.com` (a real generalist authority domain) alongside the expected agency-tier sites (saaslinkbuilder, seoprofy, linkbuilder.io, outreachdesk, digitalgratified). One big domain in the mix, not zero. Still buildable — avg referring domains needed to rank is only ~5 — but "genuinely winnable, no generalist authority sites" is no longer fully accurate.
- **"link building for lawyers"** — claim holds. Live SERP is 100% legal-marketing/SEO-agency sites (Clio, Consultwebs, PressWhizz, Dagmar, Eversparkinteractive, LinkBuilder.io) — zero generalist giants. Real volume 140/mo, only ~3 referring domains needed on average. This is the actual easiest page in the batch, not saas.

Ecommerce, agencies, real estate, startups were **not re-checked live this session** — table below carries forward the July 21 SERP notes with that caveat flagged.

## Recommended pages, ranked (Template A)

| Order | Page | Vol/mo (validated) | Backlinks to compete | SERP composition | Verdict |
|---|---|---|---|---|---|
| 1 | `/link-building-for/lawyers` | 140 | ~3 refdomains avg | 100% legal-marketing agencies, no giants | **Build first** — easiest confirmed |
| 2 | `/link-building-for/saas` | 110 | ~5 refdomains avg | Mostly agency blogs + **one Wix page** | Build second — still soft, but not the zero-competition read from before |
| 3 | `/link-building-for/real-estate` | 50 | ~1 refdomain avg | Real-estate-marketing niche sites only (not rechecked live, July 21 note) | Build third |
| 4 | `/link-building-for/startups` | 40 | not pulled | Not SERP-checked | Build after above prove out |
| 5 | `/link-building-for/ecommerce` | 170 | ~4 refdomains avg | July 21 note: neilpatel.com, wix.com, conductor.com present — **harder than KD implies**. Not rechecked live. | Hold — volume looks good but treat the July 21 warning as current until rechecked |
| — | `/link-building-for/agencies` | 70 | ~100 refdomains avg | Entire page 1 is competing link-building agencies (Loganix, Omniscient, KlientBoost, Siege Media, uSERP) — this is their own acquisition content | **Skip** — real competitors, not soft |
| — | `/link-building-for/local-seo` | 170 | not pulled | Different intent (discipline, not industry) — awkward as this slug | Reframe as blog angle, not a niche-template page |
| — | `/link-building-for/b2b`, `/link-building-for/small-business` | too low/unconfirmed | — | — | Skip |

Long-tail industries (dentists, healthcare, hvac, automotive, photographers — all 10-30/mo): don't build standalone. Batch into one `/link-building-for/local-businesses` page as subsections once the top 3 prove out.

## Template B — `/outreach-templates/[type]` landing pages

| Page | Vol/mo | KD | Notes |
|---|---|---|---|
| `/outreach-templates/blogger-outreach` | 210 (validated, was 90 in July 21 note) | 18 | Volume corrected upward this session. Still low-tier competitors (Reply.io, Mailshake, Siege Media) per July 21 SERP check, not rechecked live. |
| `/outreach-templates/guest-post` | 30 | 7 | |
| `/outreach-templates/backlink-request` | 20 | 2 | Easiest in this set |
| `/outreach-templates/broken-link-building` | 10 (narrow/long-tail phrasing — do not confuse with generic "broken link building" which is 210/mo, KD34, ~107 refdomains and much harder) | — | |
| `/outreach-templates/podcast` | 10 | — | |

**"backlink email template"** — 70/mo, KD2, confirmed exactly matching the July 21 find. Near-duplicate of `backlink-request` — cover both via H2/FAQ on one page rather than a second slug.

**GSC signal (still valid, from July 21 pull, 180d):** real unanswered impressions already hitting the site with nothing dedicated ranking — "link building outreach" (33 impr, pos 83.3), "link building email outreach" (8 impr, pos 68.6), "outreach linkbuilding" (8 impr, pos 45.2), plus smaller variants. Confirms `blogger-outreach` as the right page to build first in this template.

## Skip entirely

- **Standalone "link building email template" content** — KD50, ~104 backlinks needed. Too hard at current authority. `/outreach-templates/` covers the same intent at a fraction of the difficulty.

## Already built

- [x] `/alternatives` pages
- [x] `/blog/how-to-find-backlink-opportunities` — pillar for `/backlinks-from/` cluster

## Methodology notes

- DataForSEO `competition_level`/KD is directional, not final — it undersold "agencies" (real SERP = direct competitor agencies) and oversold "ecommerce" (real SERP = neilpatel.com/wix.com) back in July. Always confirm the top pick with a live SERP pull before building, not just the KD number.
- Site (mentiohunt.com) currently has zero clicks on any backlink/link-building query — every ranking sits past position 20. At this authority level, KD and live SERP composition are the real gate, not existing rank.
- 14 distinct `/backlinks-from/[platform]` pages confirmed via Google Suggest — low competition expected, agencies ignore purely informational platform queries. `/backlinks-from/reddit` is the strongest unbuilt spoke (high ICP overlap).
- "how to get backlinks from chatgpt" — real demand, early AI-search angle, worth owning before competitors notice.

## Next steps

- [ ] Build `/link-building-for/lawyers` first — cheapest, cleanest confirmed win
- [ ] Build `/link-building-for/saas` second
- [ ] Re-check `/link-building-for/ecommerce` and `/link-building-for/real-estate` SERPs live before committing (currently running on July 21 data only)
- [ ] Reconcile Template B slugs against [outreach-email-content-cluster.md](outreach-email-content-cluster.md) before drafting either — pick landing page vs blog post per keyword, not both
