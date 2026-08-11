# New article: target "unlinked mentions" keyword

## Background

Keyword research (DataForSEO) found a gap: "unlinked mentions" (70/mo, peak 170) and
"unlinked brand mentions" (140/mo, peak 320) both LOW competition, and no Mentiohunt page
targets either as a primary keyword — the term only shows up in passing inside
[how-to-find-backlink-opportunities.mdx](../../apps/web/resources/articles/how-to-find-backlink-opportunities.mdx)
and a handful of other articles.

Ran `/serp-rank-optimizer` in SERP-only mode (no live URL yet, so GSC step skipped) against
the live SERP for "unlinked mentions".

### SERP landscape

| Rank | Domain | Format | Length | What they have |
|---|---|---|---|---|
| 1 | ahrefs.com/blog/unlinked-mentions | Guide | ~7,500 words | Content Explorer, Screaming Frog regex, Twitter reverse-engineering, domain typo generator, reverse image search, Ahrefs Alerts. Stat: ~29-30% of brand mentions lack a link; 84% unlinked-Nike-mention example. |
| 2 | semrush.com/blog/unlinked-mentions | Guide | ~3,800 words | Semrush Brand Monitoring, Google Alerts, Authority Score prioritization, cites John Mueller's "no link = no signal" quote. Full outreach template + follow-up cadence. |
| — | zapier.com/blog/unlinked-mentions | Guide + case study | ~2,100 words | 8-step workflow, Ahrefs/Google operators/LinkedIn/Hunter. Real case study: 53 unlinked mentions reclaimed on high-authority sites in 3 months, 18k+ mentions monitored, 37% of responses came from automated follow-ups. |
| — | pageonepower.com, prowly.com, searchengineland.com | Glossary / guide | — | Definitional coverage, lower depth. |

### Gaps every top result shares

- All assume a paid tool (Ahrefs/Semrush) as the primary method. None gives a real workflow
  for a founder without a $99+/mo subscription.
- All frame this as a one-time manual project, not a recurring workflow. None ties it to daily
  automated discovery.
- None link out to free, purpose-built tools for the two hardest steps (finding the right
  contact, drafting the outreach email) — we already have both:
  [author-contact-finder.mdx](../../apps/web/resources/free-tools/author-contact-finder.mdx),
  [backlink-outreach-email-generator.mdx](../../apps/web/resources/free-tools/backlink-outreach-email-generator.mdx).
- Zapier is the only one with real outcome numbers (53 reclaimed / 3 months) — we have our own
  (3,523 emails sent, 107 replies, 12 backlinks landed) that could back a similar credibility
  section without needing to be the whole article.

## Next steps

1. Use `article-writer` skill to outline a new piece targeting "unlinked mentions" /
   "unlinked brand mentions", founder-without-paid-tools angle, aim ~2,500-3,500 words
   (between Zapier's 2,100 and Semrush's 3,800 — deeper than Zapier, less padded than Ahrefs).
2. Draft at `apps/web/resources/articles/unlinked-mentions.mdx`.
3. Cover: what counts as an unlinked mention, manual Google-operator method (free path) vs
   paid-tool method, how to prioritize which mentions to chase, contact-finding step (link to
   author-contact-finder), outreach email step (link to backlink-outreach-email-generator and
   link-building-outreach-email.mdx), follow-up cadence.
4. Add internal links from how-to-find-backlink-opportunities.mdx, link-building-outreach-email.mdx,
   and the two free-tools pages back to the new article once published.
5. Submit URL in GSC after publish.
