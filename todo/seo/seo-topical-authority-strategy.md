# SEO Focus — Mentiohunt

Young site (~50 clicks total). Positions/impressions = demand signals, not traffic yet. Articles at `/blog/<slug>`; MDX in `apps/web/resources/`. Keyword data DataForSEO-validated 2026-07-17; GSC re-pulled 2026-07-20.

**Already built (don't rebuild):** pillar `saas-backlink-building`; 6 blog articles; `backlinks-from/*` (11); `alternatives/*` (7); `compare/*` (3); `free-tools` (8). Monitoring-era pages already 301'd.

## What's working — feed it
- **Winners = programmatic `/backlinks-from/*` + `/compare/*`.** forbes pos 9.1, medium 8.2, youtube 3.1, reddit 16.4, respona-vs-pitchbox 8.4. Near page 1 with ~zero authority. This template is the wedge.
- Homepage pos 3.3. Branded "mentiohunt" pos 1 (16 clicks).
- Push forbes/reddit/medium from pos 8–16 into top 5 via internal links + tighter titles.

## Focus now (priority order)

**1. Fix `/alternatives` — DONE 2026-07-21.** Steps 1–4 and 6 applied. Step 7 (re-pull GSC) pending, earliest ~2026-08-11.

Diagnosis: hub page (`apps/web/app/alternatives/page.tsx`) itself is fine — already scoped copy, clean metadata, good author E-E-A-T. **Real problem is inside the 7 child MDX files** (`apps/web/resources/alternatives/*.mdx`): leftover "community monitoring" language contradicts CLAUDE.md positioning (community monitoring/social reply automation explicitly NOT part of product) and is why hub catches junk queries like `reddit monitor`/`twitter monitor`/`x monitor`.

Evidence: 10 "Does [tool] monitor Reddit or community forums?" FAQs across 6 of 7 pages (buzzstream 3, ahrefs 2, respona 2, pitchbox 1, backlinkgpt 1, semrush 1; postaga clean). `best-ahrefs-alternative-for-founders.mdx` worst — describes Mentiohunt itself as doing things it doesn't ship: "monitor community conversations for relevant mentions," "community reply suggestions," "get alerted when a relevant community conversation is happening" (lines ~25, 72, 131, 135, 153). 10 "community" mentions on ahrefs page, 9 on buzzstream, 7 on semrush.

GSC state (90d, pulled 2026-07-20): hub `/alternatives` = 426 impr, pos 56.2, CTR 0.23%, 1 click. Only `alternatives/best-backlinkgpt-alternative-for-founders` ranks decently (pos 11.6, 22 impr, 2 clicks) — also the page with least community cruft. Hub also outranks children for their own exact-match terms (`buzzstream alternatives` 95 impr pos 60 goes to hub, not the buzzstream child) — cannibalization, but expected to self-resolve as domain authority grows; don't over-tune.

Steps to execute:
1. Purge community/monitoring FAQs + body copy from all 7 MDX files, worst-first: `best-ahrefs-alternative-for-founders.mdx` → `best-buzzstream-alternative-for-founders.mdx` → `best-semrush-link-building-alternative-for-founders.mdx` → `best-respona-alternative-for-founders.mdx` → `best-pitchbox-alternative-for-founders.mdx` → `best-backlinkgpt-alternative-for-founders.mdx`. `best-postaga-alternative-for-founders.mdx` already clean, skip.
2. Delete every "Does X monitor Reddit/community forums?" FAQ. Replace with on-positioning FAQ (pricing reality, article-level fit, "when to choose X vs Mentiohunt").
3. Rewrite any line claiming Mentiohunt does monitoring/community-reply work → replace with actual features: article-level fit scoring, fit rationale, contact finding, ready-to-send outreach draft, approve/reject queue.
4. Fix `best-ahrefs-alternative-for-founders.mdx` frontmatter `description` — drop "community opportunities" phrase.
5. Do NOT try to engineer away the hub's off-ICP impressions (eclincher/wordstream/adheart/boundless leads — 426 impr, near-zero CTR already, not worth effort). Monitoring-query subset should shed passively once step 1–4 land.
6. After cleanup, add internal link from `saas-backlink-building` pillar + relevant blog posts into each alternatives child (mirrors what already works for backlinks-from/* pages).
7. Re-pull GSC after ~2-3 weeks to confirm off-topic impressions on hub drop and whether children start taking their own queries back from hub.

Applied 2026-07-21: all 10 monitoring FAQs removed/replaced with "Does Mentiohunt replace X entirely?" positioning FAQs across ahrefs/buzzstream/semrush/respona/pitchbox/backlinkgpt; body copy purged (worst: backlinkgpt's "Monitoring: Backlinks vs Community Conversations" section, ahrefs' "community reply suggestions"/"alerted when a relevant community conversation" lines); postaga's stray "community opportunities" line also fixed even though FAQ was clean. Step 6: linked `saas-backlink-building` pillar → ahrefs/semrush/pitchbox/respona/buzzstream; `how-to-find-backlink-opportunities` → ahrefs/semrush; `link-building-outreach-email` → buzzstream/pitchbox/respona. backlinkgpt/postaga not linked from blog posts yet — no natural anchor found, low priority (backlinkgpt already ranks pos 11.6, postaga is a 404-tool play).

**2. BOFU tools listicle — DONE 2026-07-21.** `articles/best-link-building-tools-for-founders` — highest confidence. Lists Mentiohunt + competitors.
- `link building software` (320, KD20, **+85% YoY** growing) · `best link building tools` (320, KD2) · `best seo link building software` (90, KD5, secondary).
- SERP = all listicles/roundups → format matches. Cover "link building resources" phrase inside (don't build standalone, KD23 weak).

**3. Agencies listicle — DONE 2026-07-21.** `/blog/best-saas-link-building-agencies` — built as **listicle, not pillar**.
- `saas link building agency` (vol 590 but recent 150–320; **no KD in DB**; navigational). Live SERP = agency homepages + "best agencies" listicles + local pack. Neutral comparison won't rank → match the format, Mentiohunt as an entry.
- Secondary: `outreach link building services` (110, KD1, navigational — minor).

**4. Free tools to build**

| Slug | Primary kw | Vol | KD | Notes |
|---|---|---|---|---|
| `free-tools/guest-post-sites-finder` — DONE 2026-07-21 | guest posting sites | 390 | 19 | + `guest post sites list` (90, KD16). Pairs w/ `guest-posting-for-saas`. |
| `free-tools/backlink-outreach-email-generator` — DONE 2026-07-21 | backlink outreach email generator | n/a (no DataForSEO vol, SERP-validated 2026-07-21) | n/a | Renamed from `outreach-email-generator`: "outreach email template" SERP = static listicles only (Mailshake/Siege/Titan), no tool ranks → unindexable as tool. "backlink outreach email generator" SERP has 7+ live free-tool competitors (Junia, Embarque, LogicBalls, SEO.software, ClipMove, RalfVanVeen, LaughingProfessor) → proven indexable/tool-shaped query. Matches their input types: guest post / broken link / resource page / unlinked mention, each w/ follow-up + client-side templating (no LLM call). |
| `free-tools/dofollow-link-checker` — DONE 2026-07-22 | do follow backlink checker (**spaced**) | 320 | 21 | Concatenated variant = KD63, 3x harder. Used spaced phrasing in title/H1. SERP-validated 2026-07-21 (WebSearch): live SERP = on-page link scanners (gridhooks, dofollowlinkchecker.com, rankifyer, seobility, seoreviewtools), not backlink indexes → built as URL-in, scan-outbound-links-out. Server-side fetch (SSRF-guarded, reused from `lib/onboarding/fetch-site.ts`) + `node-html-parser`, no LLM. Classifies dofollow / nofollow / ugc / sponsored, internal vs external, filter tabs. |

Skip: DA/PA checkers, `backlink generator` (spammy). `google-index-checker` = dead (106 impr, all pos 80+) — remove if never earns a click.

**5. Research assets** (own opportunity-queue data — earn links + AI citations, not keyword-driven): `saas-backlink-placement-patterns`, `saas-listicle-tool-overlap`, `state-of-saas-backlinks-2026` (annual).

## Deprioritized
- **`backlinks-from/*` expansion:** GitHub/Crunchbase/podcasts vol ~10; ProductHunt/G2/Substack no data. Build only as link-earning plays, not for traffic.

## Avoid as primary (new-domain unwinnable)
`link building`, `find backlink opportunities` (pos 59), `discover backlinks` (pos 58), all `* index checker` terms. Ignore `inurl:`/`site:` footprint junk queries.
