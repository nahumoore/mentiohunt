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
| 4 | `/link-building-for/startups` | 40 | not pulled | **Checked live 2026-09-03.** Page 1 is entirely link-building/SEO agencies and tools (Respona, LinkDoctor, Linkyjuice, Bulldog, Collaborator.pro, PressWhizz, RankOMedia, DigiMinds, Above Apex, LinkBuilder.io) — this is their own service-page content, same risk pattern as the "agencies" skip below, just less direct. | **Deprioritize** — low volume (40/mo) doesn't justify competing against agencies' home-turf content |
| 5 | `/link-building-for/ecommerce` | 170 | ~4 refdomains avg | **Rechecked live 2026-09-03 — confirmed harder than KD implies.** neilpatel.com, wix.com, conductor.com, yotpo.com, practicalecommerce.com all present alongside agencies. | **Hold** — most generalist-authority-heavy SERP in the batch, needs real content investment not the cheap-page approach |
| — | `/link-building-for/agencies` | 70 | ~100 refdomains avg | Entire page 1 is competing link-building agencies (Loganix, Omniscient, KlientBoost, Siege Media, uSERP) — this is their own acquisition content | **Skip** — real competitors, not soft |
| — | `/link-building-for/local-seo` | 170 | not pulled | Different intent (discipline, not industry) — awkward as this slug | Reframe as blog angle, not a niche-template page |
| — | `/link-building-for/b2b`, `/link-building-for/small-business` | too low/unconfirmed | — | — | Skip |

Long-tail industries (dentists, hvac, automotive, photographers — all 10-30/mo): don't build standalone. Batch into one `/link-building-for/local-businesses` page as subsections once the top 3 prove out.

## New candidate niches (SERP-scanned 2026-09-03, volume not yet pulled)

Live SERP composition only — no Apify key or DataForSEO MCP access this session, so treat these as "worth pulling real volume/KD for" rather than a committed build order. Ranked by SERP softness, the harder signal to get anyway.

| Niche | SERP composition | Verdict |
|---|---|---|
| `/link-building-for/insurance` | 100% insurance-marketing niche agencies (Sure Oak, Uppercut SEO, SERPsGrowth, Jenesis Digital, Digital Web Solutions, Lemonet, Stellar SEO, Intergrowth, Leadsurance, Trufla, LinkGraph, IgniteVisibility) — zero giants across 4 query variants, softest of the new batch | **Shipped 2026-09-03** — `insurance.mdx` built |
| `/link-building-for/contractors` | 100% construction/remodeling niche agencies (OneBaseMedia, LinkDoctor, Relentless Digital, ContractingEmpire, SERPsGrowth, BuilderGrowthEngine, TheHoth, WebFX, LinkGraph) across 4 query variants — no giants | **Shipped 2026-09-03** — `contractors.mdx` built |
| `/link-building-for/healthcare` | 100% healthcare-marketing niche agencies (LinkDoctor, RankOMedia, OutreachDesk, GrowResolve, SERPsGrowth) — no giants, but YMYL content bar applies | Strong candidate — pull volume next |
| `/link-building-for/fintech` | 100% niche agencies (Sure Oak, Awisee, Anthroly, Juicify, SERPsGrowth, LinkPanda, LinkBuilder.io) — no giants, and closer to Mentiohunt's actual B2B SaaS audience than lawyers/real-estate | Strong candidate — pull volume next |
| `/link-building-for/financial-advisors` | SmartAsset present — a genuine high-authority consumer-finance media site, not an agency | Caution — same pattern as ecommerce's neilpatel/wix problem |
| `/link-building-for/accountants` | Loganix present — the same real link-building competitor already named as the reason `agencies` was skipped | Caution — real competitor, not soft |
| `/link-building-for/hr-software` | Search Engine Land present — a major generalist SEO authority site | Caution — same pattern as ecommerce/financial-advisors |
| `/link-building-for/restaurants` | Soft (all niche local-marketing agencies), but a local-consumer vertical, not B2B | Route into the `local-businesses` batch page instead of a standalone build |

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
- [x] Template B — `/outreach-templates/[type]`: `backlink-request`, `blogger-outreach`, `broken-link-building`, `guest-post` all shipped. Only `podcast` (10/mo, lowest-priority in the table above) remains unbuilt.
- [x] Template A — `/link-building-for/[niche]`: route built (2026-08-22), modeled on the `/backlinks-from/[slug]` pattern (shared `lib/mdx.ts` loader, `getAllResources("link-building-for")`, MDX in `resources/link-building-for/`). `lawyers` and `saas` shipped — both the top two picks from the ranked table above. `real-estate` shipped 2026-09-03 — live SERP re-check confirmed the July 21 read (100% real-estate-marketing niche sites, no generalist giants). Hub + all three slugs wired into `app/sitemap.ts` (auto-discovered via `getAllResources`, no manual sitemap edit needed). `startups` and `ecommerce` remain unbuilt.
  - `saas.mdx` was deliberately written as the short, tactic-ranked "which one wins" version of the exact-match keyword, distinct from the deeper `/blog/saas-backlink-building` playbook — each links to the other rather than competing for the same query, to avoid the landing-page-vs-blog-post overlap flagged elsewhere in this doc.

**Unresolved as of 2026-08-22:**
- The "reconcile Template B against `outreach-email-content-cluster.md`" step below was never done, and that file doesn't exist anywhere in the repo — dangling reference, drop it or recreate it if the reconciliation still needs doing.
- Template B shipped without that reconciliation, and it shows: `/outreach-templates/blogger-outreach` (position 74.9, 180 impressions, 0 clicks/90d) and `/blog/link-building-outreach-email` (position 44.2, 207 impressions, 0 clicks/90d) look like the exact landing-page-vs-blog-post overlap this doc warned against — same topic, both dead in GSC. Worth deciding whether to merge, differentiate, or redirect one into the other before building anything else in this space.

## Methodology notes

- DataForSEO `competition_level`/KD is directional, not final — it undersold "agencies" (real SERP = direct competitor agencies) and oversold "ecommerce" (real SERP = neilpatel.com/wix.com) back in July. Always confirm the top pick with a live SERP pull before building, not just the KD number.
- Site (mentiohunt.com) currently has zero clicks on any backlink/link-building query — every ranking sits past position 20. At this authority level, KD and live SERP composition are the real gate, not existing rank.
- 14 distinct `/backlinks-from/[platform]` pages confirmed via Google Suggest — low competition expected, agencies ignore purely informational platform queries. `/backlinks-from/reddit` is the strongest unbuilt spoke (high ICP overlap).
- "how to get backlinks from chatgpt" — real demand, early AI-search angle, worth owning before competitors notice.

## Next steps

- [x] Build the `/link-building-for/[niche]` route/template (2026-08-22)
- [x] Build `/link-building-for/lawyers` first — cheapest, cleanest confirmed win (2026-08-22)
- [x] Build `/link-building-for/saas` second (2026-08-22)
- [x] Build `/link-building-for/real-estate` — SERP re-checked live and confirmed (2026-09-03)
- [x] Re-check `/link-building-for/ecommerce` SERP live — confirmed harder than KD implies (2026-09-03): neilpatel.com, wix.com, conductor.com, yotpo.com (high-DA ecommerce SaaS), and practicalecommerce.com (established publication) all present, plus agency-tier sites. More generalist authority in the mix than lawyers/saas/real-estate. Holding.
- [x] Re-check `/link-building-for/startups` SERP live — confirmed a different risk (2026-09-03): entire page 1 is link-building/SEO agencies' own service pages, same pattern as the `agencies` skip. Deprioritized given only 40/mo volume.
- [x] SERP-scan new candidate niches for Template A (2026-09-03) — see "New candidate niches" section below. `insurance`, `contractors`, `healthcare`, `fintech` came back soft (niche-agency-only SERPs); `financial-advisors`, `accountants`, `hr-software` flagged for a real authority/competitor in the mix; `restaurants` soft but low-ICP, routed to the future `local-businesses` batch page instead.
- [ ] Pull real volume/KD for the 4 soft-SERP candidates (`insurance`, `contractors`, `healthcare`, `fintech`) before committing to a build order — no Apify key or DataForSEO MCP access this session, so only SERP composition is confirmed, not demand size.
- [ ] Decide what to do about `/outreach-templates/blogger-outreach` vs `/blog/link-building-outreach-email` — both live, both ranking past position 40 with zero clicks on the same topic (see "Unresolved" note above). `outreach-email-content-cluster.md` doesn't exist to resolve this against, so this needs a fresh call, not just a reconciliation.
- [ ] Build `/outreach-templates/podcast` — lowest priority, 10/mo volume, only if capacity allows
