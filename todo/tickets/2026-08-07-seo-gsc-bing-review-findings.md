# SEO: fix findings from GSC + Bing Webmaster review (2026-08-07)

## Background

Reviewed 90-day Google Search Console data + Bing Webmaster Tools for
`mentiohunt.com`. Site totals: 75 clicks / 8,135 impressions / 0.92% CTR / avg
position 56.8. Bing: zero crawl issues, traffic negligible (low market share,
confirms same pages as GSC — no new findings, no action needed there beyond
what's listed below).

Concerning trend: daily impressions grew from ~30-50/day (June) to 300-500/day
(early Aug), but avg position got *worse* over the same window (mid-30s → 70s).
Reads as: lots of new programmatic pages (`/alternatives/*`, `/backlinks-from/*`)
getting indexed fast, landing deep, dragging the average down. Growth in reach,
not yet in rank — worth re-checking this trend in a few weeks once the pages
listed below are fixed, to see if it self-corrects or needs more attention.

## 1. Principal target keyword page doesn't target the keyword

CLAUDE.md names `automated link building tool` as the principal SEO target.
The page built for this — [`/features/link-building-software`](apps/web/app/features/%5Bslug%5D/page.tsx)
(content in [`apps/web/consts/features.ts:258`](apps/web/consts/features.ts:258))
— has **zero occurrences** of that exact phrase anywhere: not in `shortTitle`
(title tag), `description` (meta), `title` (H1), `eyebrow`, `heroBadge`, FAQ, or
body copy. Confirmed via GSC per-page query breakdown: page gets impressions
only for the generic term `link building software` and variants, all ranking
position 74-88 (page 8+) — a crowded head-term against Ahrefs/Semrush/Pitchbox
that a new site won't win soon.

Live title tag today: `"Link building software — Mentiohunt"` (site-wide
template in `apps/web/app/layout.tsx` appends `— Mentiohunt`).

**Fix** — in `apps/web/consts/features.ts`, `slug: "link-building-software"` entry:

| Field | Current | Change to |
|---|---|---|
| `shortTitle` (title tag) | "Link building software" | "Automated Link Building Tool for Founders" |
| `title` (H1) | "Link building software built for founders, not agencies" | "The automated link building tool built for founders, not agencies" |
| `description` (meta) | no exact phrase | lead with it, e.g. "Mentiohunt is an automated link building tool that finds prospects, scores fit, and drafts outreach — daily, without an agency." |
| `keyword` | "link building software" | "automated link building tool" |
| FAQ | no definition entry | add "What is an automated link building tool?" — direct-answer paragraph, written for the featured-snippet box |
| `eyebrow` / `heroBadge` | "Link building software — for founders" | "Automated link building tool" |

Also add internal links pointing to this page with anchor text "automated link
building tool" — from the homepage, relevant blog posts, and nav. Right now
this feature page has no `relatedArticle` link in either direction, unlike
sibling feature pages.

## 2. Highest-impression page ranks page 6-8 for exact buyer-intent terms

`/blog/best-saas-link-building-agencies` — 1,295 impressions (most of any page
on the site), 0 clicks, avg position 73.4. Per-query breakdown shows it already
surfaces for exact commercial terms:

- "best saas link building agency" — 98 impr, pos 58.5
- "link building agency for saas" — 98 impr, pos 79.4
- "best link building services for saas companies" — 67 impr, pos 80.0
- "best saas link building agencies" — 92 impr, pos 61.7
- "b2b saas link building agency" — 65 impr, pos 83.1

Google already considers this page relevant for high buyer-intent queries — it's
too thin/weak to crack top 20. Single highest-leverage content page on the site.

**Fix**: expand content depth (real comparison table with current data, pricing
ranges, updated freshness date), get a handful of backlinks pointed at this
specific URL. Don't just retarget keywords — the page already has the right
topical signal, it needs authority + depth.

## 3. Good rank, bad CTR — title/meta rewrites, no rank work needed

Quick wins, all currently ranking well but not converting impressions to clicks:

- `/compare/respona-vs-pitchbox` — pos 7.6 for "respona vs pitchbox" (75 impr),
  pos 7.0 for "pitchbox.com vs respona.com" (29 impr), but 1.3% CTR combined.
  Rewrite title/meta with a stronger hook (year, "which wins", pricing angle).
- `/backlinks-from/pinterest` — pos 21.5, 312 impr, 0.32% CTR. One push from
  page 2 — tighten title, add 2-3 internal links.
- `/blog/resource-page-link-building` — pos 20.6, 152 impr, 0 clicks. One nudge
  from page 1.
- `/backlinks-from/forbes` — already converting (6 clicks, pos 8.8, 4.2% CTR).
  Give more internal link weight to push toward top 3.

## 4. `/alternatives` hub competes with its own children

Hub page ranks pos 56-90 for generic "X alternative" queries, many off-topic
for the business (e.g. "adheart alternative", "eclincher alternative" — Google
seems confused about what the hub is for). Meanwhile individual sub-pages do
fine on their own — e.g. `/alternatives/best-backlinkgpt-alternative-for-founders`
ranks pos 10.5.

**Fix**: stop the hub page from targeting the same broad "X alternative" terms
as its children. Turn it into a clean directory/index (categorized list linking
out to each alternative page) instead of trying to rank standalone.

## Not needed

- Bing Webmaster: crawl issues clean, no separate action — fixes above cover
  both engines since same URLs/titles serve both.
- Homepage (pos 4.5, 13% CTR) and branded "mentiohunt" queries (pos 1.4, 25%
  CTR) are healthy, no action.

## Suggested priority order

1. Fix `/features/link-building-software` metadata/copy (item 1)
2. Expand `/blog/best-saas-link-building-agencies` content (item 2)
3. Title/meta rewrites on near-page-1 pages (item 3)
4. Restructure `/alternatives` hub (item 4)
5. Re-check impressions-vs-position trend in a few weeks
