# SEO Strategy — Outstanding Work

GSC-validated 2026-07-13. Site still young (~50 clicks total) — positions/impressions are demand signals, not traffic. Articles live at `/blog/<slug>`; MDX in `apps/web/resources/`.

**Already built (don't rebuild):** pillar `saas-backlink-building`; articles `link-building-outreach-email`, `how-to-find-backlink-opportunities`, `resource-page-link-building`, `unlinked-brand-mentions`, `guest-posting-for-saas`, `haro-link-building`; full `backlinks-from/*` (11 pages); `alternatives/*` (7); `compare/*` (3); `free-tools` incl. anchor-text-generator. Monitoring-era pages already removed from code.

## PHASE 1: Fixes first (highest ROI — built pages underperforming) — DONE 2026-07-13

- [x] **`link-building-outreach-email` slipped hard:** pos 20.7 → 43.8 on 190 impr. Added inbound links from pillar (`saas-backlink-building`, which previously linked to neither target page — also had a broken `/resources/unlinked-brand-mentions` link, fixed to `/blog/...`) and from `resource-page-link-building`.
- [x] **`how-to-find-backlink-opportunities`:** 417 impr (site's highest), stuck pos 49. Added inbound links from pillar + `guest-posting-for-saas` (previously missing). Content already had strong E-E-A-T signals — no keyword padding added.
- [x] **Refreshed `backlinks-from/pinterest`:** added a concrete worked example (saves-vs-clicks timing). Nofollow reality + dofollow paths were already covered.
- [x] **Refreshed quora, reddit, wikipedia:** added worked examples to each. Reddit had a stale broken link to `reddinbox.com` (old brand domain, tool never existed on mentiohunt.com) — replaced with `/free-tools/backlink-opportunity-finder`.
- [x] **Pitchbox buyer intent:** added "Is Pitchbox Worth It? Our Honest Take" section + FAQ entry to `alternatives/best-pitchbox-alternative-for-founders` targeting bare "pitchbox"/"pitchbox review" intent. Pricing breakdown was already thorough.
- [x] **`/alternatives` hub cleanup:** tightened H1/metadata/subtext from generic "every tool" framing to explicit "link building and backlink outreach tools" scoping (should reduce off-topic query matches). Changed anchor text on cross-links from `ahrefs`/`semrush` alt pages to "best Pitchbox alternative" / "best BuzzStream alternative" instead of bare brand name, to help Google attribute those queries to the dedicated pages instead of the hub.

**Watch in next GSC pull:** whether hub copy change actually reduces off-topic impressions (trengo/zutrix/etc.) without hurting the legitimate ones — this is a signal-strength bet, not guaranteed.

## Consolidation (decision due)

- **Fold `unlinked-brand-mentions`** into `how-to-find-backlink-opportunities` + 301. Two review cycles, no improvement (142 impr pos 67; SERP branded by ahrefs/moz/semrush).
- **Verify monitoring pages 301** (not 404): /twitter-monitoring, /reddit-monitoring, /quora-monitoring, /blog/reddit-marketing, /free-tools/reddit-user-analyzer.

## PHASE 2: Content to build

1. **Second pillar** `/blog/saas-link-building-agency-vs-software` — decision pillar with POV (more transparent than agency, less work than software). Primary: `saas link building agency` (590, low KD) · `outreach link building services` (70, KD9). Feeds `alternatives/*` + `compare/*`.
2. **AI-citations article** `/blog/backlinks-ai-search-citations` — do backlinks influence ChatGPT/Perplexity/AI Overview citations. GSC surfacing: "chatgpt to create backlinks" (pos 46), "will more website citation links help you show up in chatgpt" (pos 82). Interlink `backlinks-from/chatgpt` (pos 45) + pillar. Verify kws first: `ai search citations`, `chatgpt citations seo`, `llm seo backlinks`, `generative engine optimization backlinks`.
3. **BOFU tools listicle** `articles/best-link-building-tools-for-founders` — lists Mentiohunt + competitors. `best link building tools` (320, low KD) · `link building software` (320, KD17) · `best seo link building software` (90, KD5). GSC: "linkbuilding software" (pos 98), "link building resources" (pos 88) — no page targets these yet.
4. **Research assets** (own opportunity-queue data — earn links + AI citations, not keyword-driven): `saas-backlink-placement-patterns`, `saas-listicle-tool-overlap`, `state-of-saas-backlinks-2026` (recurring annual asset).

## `backlinks-from/*` expansion

Pattern proven (forbes 4 clicks pos 9.2; youtube pos 3.1; medium pos 8.1). New platforms — **validate vol/KD per platform first**: GitHub, Substack, Product Hunt, G2/Capterra, Crunchbase, podcasts, newsletters. Each must link up to pillar + across to `how-to-find-backlink-opportunities`.

## Free tools to build

| Slug                                  | Primary keyword            | Vol | KD  | Notes                                                                                         |
| ------------------------------------- | -------------------------- | --- | --- | --------------------------------------------------------------------------------------------- |
| `free-tools/guest-post-sites-finder`  | guest posting sites        | 390 | 3   | + `guest post sites list` (90, KD16). Pairs with `guest-posting-for-saas`.                    |
| `free-tools/outreach-email-generator` | outreach email template    | 170 | low | + `cold email generator` (70) · `link building outreach email` (50, KD3). Direct product CTA. |
| `free-tools/dofollow-link-checker`    | do-follow backlink checker | 320 | 22  | Qualifies prospects; slightly harder SERP.                                                    |

**Skip:** high-KD authority/DA-PA checkers, `backlink generator` (spammy, off-positioning). `free-tools/google-index-checker` = dead end (106 impr, every query pos 80+) — candidate for removal if it never earns a click.

## Avoid as primary (new-domain unwinnable, GSC-confirmed)

`link building`, `find backlink opportunities` (pos 59), `discover backlinks` (pos 58), all `* index checker` terms. Ignore `inurl:`/`site:` footprint junk queries (people Googling prospecting footprints).
