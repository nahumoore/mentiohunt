# Mentiohunt — Topical Authority Content Map

> Built 2026-06-12 from GSC + DataForSEO (US, en). Volumes = US/mo, KD = DataForSEO difficulty.
> Pairs with [pseo-strategy.md](./pseo-strategy.md), [alternative-articles.md](./alternative-articles.md), [free-tool-strategy.md](./free-tool-strategy.md).

## The bet: own "Reddit for founders"

A new domain can't out-authority Ahrefs/Moz/Semrush on `backlink` / `link building` terms — those SERPs are walls. GSC confirms the problem: most pages aren't even **indexed** yet (low authority = Google ignores us).

Fix = pick one narrow niche and go deep, so Google sees us as a topical authority and starts trusting/indexing the whole site. The winnable niche, with direct product fit:

**Reddit marketing & monitoring for founders.**

Why this niche:

- Every keyword is **KD ≤ 27, most under 15** — actually rankable now.
- Maps 1:1 to the community-monitoring engine + assets we already own (`/reddit-monitoring`, `/free-tools/subreddit-finder`, `/free-tools/reddit-user-analyzer`).
- Coherent topic = tight internal linking = faster indexing + compounding authority.
- Founder ICP lives on Reddit; bottom-funnel intent ("how do I market on Reddit without getting banned") converts.

Keep the backlink/outreach pages we have (they rank — `/compare/respona-vs-pitchbox` is p1), but **stop expanding that cluster for now**. Concentrate new content on Reddit until the domain has authority to spend elsewhere.

---

## Architecture

```
PILLAR:  /blog/reddit-marketing  (guide: "Reddit Marketing for Founders")
           │
   ┌───────┼───────────────┬──────────────┬─────────────────┐
   ▼       ▼               ▼              ▼                 ▼
 A.Funda  B.Promote     C.Monitor      D.Find           E.Tools &
 mentals  w/o ban       (product)      communities       comparisons
```

Every spoke links **up** to the pillar and **across** to a relevant free tool / monitoring landing page. The pillar links down to every spoke.

---

## Pillar

| Page                     | Target                                                                                                      | Vol   | KD  |
| ------------------------ | ----------------------------------------------------------------------------------------------------------- | ----- | --- | --------- |
| `/blog/reddit-marketing` | `marketing on reddit` (1000, KD19), `reddit marketing` (1000, KD32), `reddit digital marketing` (480, KD14) | ~1000 | 19  | **Built** |

Comprehensive guide. Internal-links to all five sub-clusters. This is the hub Google reads to understand the site's topic.

---

## Cluster A — Reddit marketing fundamentals (top-funnel, ICP)

| Article                               | Target keyword(s)                                        | Vol | KD  |
| ------------------------------------- | -------------------------------------------------------- | --- | --- |
| `/blog/reddit-for-business`           | `reddit for business`                                    | 880 | 27  |
| `/blog/reddit-business-ideas`         | `reddit business ideas`                                  | 590 | 7   |
| `/blog/reddit-marketing-strategy`     | `reddit marketing strategy`, `reddit marketing services` | 140 | low |
| `/blog/social-media-marketing-reddit` | `social media marketing reddit`                          | 110 | 20  |

## Cluster B — Promote without getting banned (highest-intent, brand voice)

> Founders' #1 Reddit fear. Owning this = trust + conversions.

| Article                                   | Target keyword(s)                                                     | Vol | KD  |
| ----------------------------------------- | --------------------------------------------------------------------- | --- | --- |
| `/blog/reddit-self-promotion-rules`       | `reddit self promotion rules` (50, KD8), `reddit self promotion` (40) | 90  | 8   |
| `/blog/how-to-promote-on-reddit`          | `how to promote on reddit`                                            | 40  | 11  |
| `/blog/how-to-promote-your-app-on-reddit` | `promote [app/saas/product] on reddit` (long-tail)                    | —   | low |

## Cluster C — Monitor & listen (the product engine)

> Landing pages own the head/commercial terms (template at `/(monitoring)/[platform]-monitoring`, driven by `consts/community-monitoring`). Blog spokes feed them.

| Page                                | Type    | Target                                                                                         | Vol  | KD  | Status                             |
| ----------------------------------- | ------- | ---------------------------------------------------------------------------------------------- | ---- | --- | ---------------------------------- |
| `/reddit-monitoring`                | landing | `reddit monitoring`                                                                            | 1600 | 1   | Built — invest links, push to p1   |
| `/twitter-monitoring`               | landing | `twitter monitoring`                                                                           | 880  | low | Built — rising +519%/yr            |
| `/quora-monitoring`                 | landing | `quora monitoring`                                                                             | low  | —   | Built                              |
| `/blog/reddit-alerts`               | spoke   | `alerts for reddit app` (320,KD3), `reddit alerts` (170,KD4), `reddit keyword alerts` (70,KD3) | ~560 | 3   | **Build — easiest win in the map** |
| `/blog/free-social-listening-tools` | spoke   | `free social listening tools`                                                                  | 720  | 11  | Build (listicle incl. self)        |
| `/blog/unlinked-brand-mentions`     | spoke   | `unlinked brand mentions`                                                                      | 140  | 3   | Build — bridges to backlink engine |

## Cluster D — Find the right communities (ties to free tools)

| Page                                            | Target                                                                                      | Vol    | KD    |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------- | ------ | ----- |
| Optimize `/free-tools/subreddit-finder`         | `search for subreddits` / `subreddit search` (590, KD10), `reddit search tool` (720, KD13)  | ~1300  | 10–13 |
| `/blog/best-subreddits-for-entrepreneurs`       | `best subreddits for entrepreneurs / startups / marketing` (long-tail set)                  | —      | low   |
| **Programmatic** `/best-subreddits-for/[niche]` | `best subreddits for [x]` pattern (dating/women/stories prove the template ranks at KD 1–5) | varies | 1–5   |

## Cluster E — Tools & comparisons (bottom-funnel)

> Pull the Reddit-relevant items from [alternative-articles.md](./alternative-articles.md). These already get GSC impressions.

| Page                                                        | Target                                                | Notes                       |
| ----------------------------------------------------------- | ----------------------------------------------------- | --------------------------- |
| `/blog/reddit-marketing-tools`                              | `reddit marketing tool` (140, KD8)                    | Listicle incl. self         |
| `/alternatives/best-f5bot-alternative-for-founders`         | `f5bot alternative`                                   | Built — optimize            |
| `/compare/google-alerts-vs-*` & `google alerts alternative` | `google alerts alternative`                           | Per alternative-articles.md |
| Reddit-monitoring competitor compares                       | `octolens`, `syften`, `redreach`, `subreddit signals` | Per alternative-articles.md |

---

## Existing assets already in the niche (interlink these now)

`/reddit-monitoring` · `/twitter-monitoring` · `/quora-monitoring` · `/backlinks-from/reddit` (p17, near win) · `/backlinks-from/quora` · `/free-tools/subreddit-finder` · `/free-tools/reddit-user-analyzer` · `/alternatives/best-f5bot-alternative-for-founders`.

**Indexing fix:** many of these are currently NOT indexed. Tight cross-linking within this cluster + a handful of backlinks to the pillar is the lever to get them crawled and ranked.

---

## Build order

**Phase 1 — establish the hub (do in order):**

1. `/blog/reddit-marketing` pillar — the hub everything links to.
2. `/blog/reddit-alerts` — KD 3, ~560/mo, links to `/reddit-monitoring`.
3. `/blog/reddit-self-promotion-rules` — KD 8, highest-intent.
4. `/blog/reddit-business-ideas` — KD 7, 590/mo, top-funnel.
5. Optimize `/free-tools/subreddit-finder` for `search for subreddits` (590, KD10).

**Phase 2 — widen the cluster:** 6. `/blog/free-social-listening-tools` — 720, KD 11. 7. `/blog/reddit-for-business` — 880, KD 27. 8. `/blog/reddit-marketing-tools` — KD 8. 9. `/blog/how-to-promote-on-reddit` — KD 11. 10. `/blog/unlinked-brand-mentions` — KD 3 (bridge back toward backlink engine).

**Phase 3 — scale + adjacent platforms:** 11. Programmatic `/best-subreddits-for/[niche]` (founder niches first). 12. New monitoring landing pages by volume × fit: `social-media-monitoring` (1000, KD16), `tiktok-monitoring` (140), `telegram-monitoring` (140), `youtube-monitoring` (70). 13. Reddit-monitoring competitor comparisons (alternative-articles.md).

---

## Guardrails

- Resist drifting back to generic backlink/SEO articles — that dilutes the topical signal. Backlink pages stay, but new effort goes to Reddit until authority builds.
- Product language: opportunities, fit, reply suggestions, queues (per AGENTS.md). Not generic social-media-management filler.
- Skip wrong-intent platform pages: facebook/instagram (parental), github (devops), news (KD69). `x monitoring` (1300) = alias H2 on twitter page only.
- Re-check top-3 SERP before any KD 20+ page (`reddit for business`, `reddit marketing`).
