## Programmatic SEO

One template. One data source. Hundreds of pages. If your product has natural data or category structures, programmatic SEO is the fastest way to scale keyword coverage without writing every page manually.

| Page Type                       | Template Logic                                      | Example Keywords            |
| ------------------------------- | --------------------------------------------------- | --------------------------- |
| Feature pages                   | One page per core feature`/features/[feature-name]` | extract colors from website |
| font detection chrome extension |
| Alternative pages               | One page per competitor`/alternatives/[competitor]` | csspeeper alternative       |
| whatfont replacement            |
| Category pages                  | One page per use case`/for/[use-case]`              | best tools for designers    |
| chrome extensions for devs      |
| Profession pages                | One page per profession`/playbooks/[profession]`    | seo playbook for dentists   |
| contractor seo guide            |

### First `/features` batch

Template: `/features/[slug]`

Initial pages:

| URL | Primary keyword | Search intent | Page angle |
| --- | --- | --- | --- |
| `/features/backlink-opportunity-queue` | backlink opportunity queue | Find a workflow/tool for discovering backlink prospects | Turn sitemap, articles, keywords, and competitors into a daily queue with fit rationale and outreach prep. |
| `/features/community-reply-alerts` | community reply alerts | Find a way to monitor communities and know when to reply | Watch relevant threads, explain fit, and generate a suggested founder-safe reply before the thread goes cold. |

Expansion logic: add one entry to `apps/web/consts/features.ts` per feature keyword, then the `/features/[slug]` template generates the page and sitemap entry.
