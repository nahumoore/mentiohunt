# Write the `/blog/automated-link-building-tools` article (principal target keyword)

## Background

`automated link building tool` is now the principal target keyword (CLAUDE.md → SEO).
Nothing on the site currently targets it. As of 2026-08-01 the exact phrase appears
**once** in the entire web app — as a fake forum quote in
`apps/web/components/landing/hero-ticker.tsx:70`. No page title, H1, URL, or meta
description contains it.

## SERP research (2026-08-01)

The ranking set is almost entirely **roundup listicles**, not vendor pages:

| Ranking page | Format |
| --- | --- |
| blazehive.io — "12 Best Automated Link Building Tools Compared (2026)" | listicle, ~7,500 words, comparison table |
| distribb.io — "Best Automatic Link Building Software 2026" | listicle |
| questiondb.io — "Automated Link Building: Best Tools + Practices" | listicle |
| uprankly.com — "Top 4 Link Building Automation Tools" | listicle |
| gitnux.org — "Best Automatic Link Building Software Ranked" | listicle |
| link-assistant.com/linkassistant | only vendor page in the set |

Two conclusions:

1. A feature page alone will not rank here. The format Google rewards is a roundup.
2. Several of the ranking listicles are published by vendors ranking their own product
   at #1. That is the available play.

## Prerequisite — DONE (2026-08-01)

Nine resource files claimed Mentiohunt does not send outreach (stale pre-automation
copy), which disqualified it from the category it is now trying to rank in. All
corrected, `dateModified` bumped. See git history for 2026-08-01. The worst offender
was this article's future sibling — `best-link-building-tools-for-founders.mdx` FAQ 3
answered "Do link building tools actually build links automatically?" with a flat "No".

## What to build

New MDX at `apps/web/resources/articles/automated-link-building-tools.mdx`
→ renders at `/blog/automated-link-building-tools`, auto-added to sitemap by
`apps/web/app/sitemap.ts` (no wiring needed).

- **Title:** `12 Best Automated Link Building Tools (2026)` — keyword at the front, ~55 chars
- **H1** matching; exact phrase inside the first 100 words
- **Comparison table** early: Tool / What it automates / Where automation stops /
  Best for / Starting price. GFM tables already work (`remarkGfm` in
  `apps/web/app/blog/[slug]/page.tsx`)
- **Length target ~3,000–4,000 words.** Do not chase blazehive's 7,500. Win on point of
  view, not volume.
- **Tools to cover** — prioritize ones with an existing page to link to: Pitchbox,
  BuzzStream, Respona, Postaga, BacklinkGPT, Semrush, Ahrefs, LinkAssistant. Plus
  LinkDR, Distribb, Mailshake, Featured to match SERP coverage.
- **Differentiated angle:** a "where automation should stop" section. Every competitor
  listicle skirts this. Mentiohunt has a real position — automation ends at the first
  reply, then the founder owns the relationship — and it is the thing that makes the
  page worth linking to rather than being listicle #13.
- FAQ block in frontmatter (feeds FAQPage schema automatically).

## Cannibalization — must handle

`articles/best-link-building-tools-for-founders.mdx` is the closest existing page and
will compete unless separated:

- Keep that one **budget-tiered and founder-scoped** ("what's worth paying for at each
  stage"). Keep this new one **automation-scoped**.
- Its FAQ 3 now discusses automation — move the depth here and have it link out to this
  page as the fuller answer.

## Internal linking — do not repeat the existing mistake

`best-link-building-tools-for-founders` links out to six pages but **nothing on the site
links to it**. It is an orphan. Do not ship this article the same way. Inbound links from:

- homepage FAQ (`apps/web/consts/faq.ts`)
- `/features/link-building-software`
- the Pitchbox, Postaga, BuzzStream, Respona alternatives pages
- `best-link-building-tools-for-founders` itself

The `internal-linker` skill covers the outbound direction once the file exists.

## Next steps

1. Use the `article-writer` skill — outline first, then draft (per skill rules).
2. Header image at `/resources/automated-link-building-tools/header.webp`.
3. Add the inbound links listed above.
4. Submit to GSC once live and track position for the exact phrase.

## Related open work (not blocking this ticket)

- **Homepage + `/features/link-building-software` are wrong in the opposite direction.**
  Both say outreach waits for approval ("Nothing sends until you approve", "You just
  approve or reject"). There is no approval gate in the code — sequences are scheduled
  at discovery (`apps/server/src/processes/onboarding/prospect-sequences.ts:45-61`),
  inserted `pending`, and fired when due; the user's role is monitor-and-cancel. Highest
  traffic pages on the site, and they undersell the automation this keyword is about.
- **~20 instances of "outreach prep" phrasing** across the alternatives pages'
  `QuickVerdict` / `WhenToChoose` blocks. Not false, but understates the product as
  prep-only. Positioning call, deliberately left alone on 2026-08-01.
- A sixth feature page (`automated-link-building` in `apps/web/consts/features.ts`) to
  catch transactional variants and give this article a strong #1 destination.
