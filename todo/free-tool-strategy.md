# Free Tool Strategy

## What Already Exists

`/free-tools/directory-backlink-opportunity-finder`

Takes a product URL → checks Supabase directories table → returns directories where the product is not yet listed (gap scan). Covers the "find new directory opportunities" use case completely.

**Keywords it already owns:**
- "free backlink building tools"
- "startup directory free"
- "free link building sites"
- "submit startup to directories"
- "directory submission tool"
- "where to get backlinks free"

Do not build tools that overlap with the gap scan angle. Any new tool must answer a clearly different question.

---

## Keyword Research Summary (May 2026)

Three Apify runs, US/English, Google Suggest. Dominant signal clusters:

| Cluster | Top suggestions | Intent |
|---|---|---|
| Free backlink checker | "free backlink checker", "how to check backlinks for free", "who links to", "website backlink scanner" | Tool — check existing backlinks |
| Where to get backlinks | "where to get backlinks free", "where can I get backlinks for my website" | Transactional — already covered by existing tool |
| SaaS / startup link building | "link building for saas companies", "saas link building strategy", "how to get backlinks for startup" | Informational + landing page |
| Competitor intelligence | "link building agencies for saas", "saas link building services" | Commercial |

---

## New Tool Opportunities (No Cannibalization)

### Tool 2 — Free Backlink Checker
**Route:** `/free-tools/backlink-checker`

**Different from existing tool:** The gap tool finds *new* directory opportunities. This tool shows *existing* backlinks pointing to a URL — completely orthogonal.

**Target keywords:**
- "free backlink checker" (highest demand in dataset)
- "free backlink checker online"
- "how to check backlinks for free"
- "who links to" / "who links to my website"
- "website backlink scanner"
- "how to check backlinks to your website"

**How it works with current stack:**
- User pastes URL
- Apify actor fetches referring domains (use an actor that scrapes backlink data — e.g. a Common Crawl-based or dedicated backlinks actor already available on Apify)
- Cross-reference results against the Supabase directories table → label any result that matches a known directory
- Show: domain, anchor text, "known directory" badge if matched

**Upsell hook:** "Sign up to track new backlinks automatically and see competitor gaps."

**Build complexity:** Medium — needs the right Apify actor selected and tested. The cross-reference with the directories table is free.

---

### Tool 3 — Competitor Directory Gap
**Route:** `/free-tools/competitor-directory-gap`

**Different from existing tool:** The gap tool checks one URL against all directories. This takes two URLs (yours + competitor) and finds directories where the competitor is listed but you are not — a different framing with higher commercial intent.

**Target keywords:**
- "competitor backlink gap"
- "link building for saas companies" (informational → tool CTA)
- "saas link building strategy" (informational → tool CTA)
- "how to get backlinks for startup"
- "where to find backlinks" (directional, same intent)

**How it works with current stack:**
- User pastes their URL + a competitor URL
- Apify actor scrapes the competitor's known directory listings (crawl the competitor domain, look for directory footprints, or check directories table rows for the competitor domain)
- Directories table: query rows where competitor is listed → subtract rows where user is listed → return the gap list
- Result: "Competitor is listed on 12 directories you're not on" + the list

**Upsell hook:** Full competitor backlink analysis, not just directories.

**Build complexity:** Medium-low if directory listing detection is already in place for the gap scan. Adding a second URL field and a comparison query is the main delta.

---

### Tool 4 — Startup Directory Browser (Static / SSG)
**Route:** `/free-tools/startup-directories` or `/startup-directories`

**Not a scanner — a browsable index.** Render the full Supabase directories table as a static or ISR page. Filter by category, free/paid, DA. No user input required.

**Target keywords:**
- "startup directory"
- "startup directory free"
- "startup business listing"
- "free startup directories"
- "directory listing for saas"

**How it works with current stack:**
- SSG/ISR page that reads all active directories from Supabase
- Filter sidebar: category, free only, sorted by DA
- Each row: name, domain, category, free/paid badge, submit link
- Link to the gap scanner tool from every row

**Upsell hook:** "Want to know which ones you're missing? Run the gap scan."

**Build complexity:** Low — pure read from existing table, no Apify needed.

---

## Build Order

| Priority | Tool | Reason |
|---|---|---|
| 1 | Startup Directory Browser | Lowest effort, indexes existing data, feeds traffic to the gap tool, captures "startup directory" cluster |
| 2 | Competitor Directory Gap | Highest signup intent, small delta from existing gap scan logic |
| 3 | Free Backlink Checker | Highest traffic ceiling, needs Apify actor selection first |

---

## Notes

- Tool 2 (backlink checker) competes with Ahrefs/Semrush brand searches. Go after the generic "free backlink checker online" angle, not "free backlink checker ahrefs alternative."
- Tools 3 and 4 share internal links back to the gap scanner — they extend the cluster, not dilute it.
- All three feed the same upsell: a recurring backlink opportunity queue inside Mentiohunt.
- "saas link building strategy" and "how to get backlinks for startup" are better served by a blog post with tool CTAs than a dedicated tool page.
