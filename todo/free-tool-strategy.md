# Free Tool Strategy

## Built (source of truth: `apps/web/consts/free-tools.ts`)

| Tool | Route | What it does |
|---|---|---|
| `directory-opportunity-finder` | `/free-tools/directory-opportunity-finder` | URL → directories where product isn't listed |
| `directory-backlink-opportunity-finder` | `/free-tools/directory-backlink-opportunity-finder` | Same, backlink-framed variant |
| `backlink-opportunity-finder` | `/free-tools/backlink-opportunity-finder` | Finds backlink opportunities |
| `competitor-backlink-gap` | `/free-tools/competitor-backlink-gap` | Your URL + competitor URL → gap list |
| `backlink-price-calculator` | `/free-tools/backlink-price-calculator` | Estimates backlink cost |
| `subreddit-finder` | `/free-tools/subreddit-finder` | Community monitoring engine, free tier |

Do not build tools that overlap with any of the above.

---

## Keyword Research (June 2026)

### Backlink side

| Keyword | Vol/mo | KD | Avg backlinks to rank | Verdict |
|---|---|---|---|---|
| `free backlink checker` | 3,600 | 81 | 16,736 | Ahrefs/Moz wall. Skip. |
| `free backlink tool` | 390 | 82 | 18,442 | Skip. |
| `free link building tool` | 390 | 42 | 861 | Possible long-term, needs authority |
| `free backlink analysis` | 170 | 82 | 19,143 | Skip. |
| `free backlink monitor` | 40 | 67 | 15,925 | Skip. |

Generic "free backlink checker" space is owned by Ahrefs/SEMrush/Moz. KD 80+ across the board. Not worth targeting until domain authority grows substantially.

### Community monitoring side

| Keyword | Vol/mo | KD | Avg backlinks to rank | Notes |
|---|---|---|---|---|
| `free social listening tool` | 720 | **16** | ~3,177* | SERP = listicles, not actual tools |
| `reddit monitoring tool` | 40 | LOW | 0.9 | Already flagged in pseo-strategy.md |

*KD 16 means Google doesn't heavily weight those backlinks — content quality can win here.

---

## New Tool Opportunities

### Tool 7 — Startup Directory Browser (Static / ISR)
**Route:** `/free-tools/startup-directories` or `/startup-directories`

Browsable index of the Supabase directories table. No user input. Pure read.

**Target keywords:** "startup directory", "startup directory free", "free startup directories", "directory listing for saas"

**How it works:** SSG/ISR page reads all active directories. Filter by category, free/paid, DA. Each row links to the gap scanner.

**Build complexity:** Low — no Apify, pure Supabase read from existing table.

---

### Page (not tool) — Free Social Listening
**Route:** `/free-social-listening-tools` or `/free-tools/social-listening`

720/mo, KD 16. SERP is listicles — a curated list page wins, not a full interactive tool. Feature `subreddit-finder` as the free community monitoring option for founders. Include 4-5 other legit free tools to give the page list-credibility.

**Target keywords:** "free social listening tool", "free social media monitoring tool", "reddit monitoring free"

**Build complexity:** Content page. No engineering required.

---

## Build Order

| Priority | Item | Effort | Reason |
|---|---|---|---|
| 1 | Startup Directory Browser | Low | Indexes existing data, no Apify, feeds gap tool traffic |
| 2 | Free Social Listening page | None (content) | 720/mo KD 16, promotes `subreddit-finder` |
| 3 | Free Backlink Checker | Medium | Highest traffic ceiling, needs Apify actor — revisit when authority grows |

---

## Notes

- `free link building tool` (KD 42, 390/mo) becomes worth targeting once domain has 100+ referring domains. Park it.
- All tools feed the same upsell: recurring opportunity queue + community monitoring inside Mentiohunt.
- Do not target "free backlink checker" head-on — go after the long-tail ("free backlink checker for startups", "free backlink checker small business") only after the directory browser and social listening page are live.
