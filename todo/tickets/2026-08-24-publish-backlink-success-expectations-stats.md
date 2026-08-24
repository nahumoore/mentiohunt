# Publish backlink-success expectation stats (avg emails per placed backlink)

## Background

Ivan Fedyanin (`ivan.a.fedyanin@gmail.com`) churn feedback, 2026-08-24: "It
would be very helpful to set expectations... by publishing statistics
specifically for Mentiohunt, for example, the average number of emails it
takes to secure a backlink."

We already publish outreach stats at
`apps/web/app/link-building-outreach-statistics-2026/page.tsx`, sourced from
`apps/web/content/link-building-statistics/2026.ts` (reply rate 7.6%,
reply-by-DR, reply-by-relevance-fit, reply timing, follow-up lift). The
`.claude/skills/statistics-article/SKILL.md` skill recomputes these from
Supabase (`prospect_sequences`, `backlink_prospects`) and rewrites that
edition file.

Gap: none of the current stats answer "how many emails/how long until I get
an actual backlink placed" — the funnel stops at reply rate. There's no
`won` / placed-backlink outcome tracked anywhere in the schema today
(checked `backlink_prospects`, `prospect_sequences` — no placement/won
column). Without that, we can't compute "avg emails per secured backlink" at
all — it needs a data source first, not just a new chart.

## Next steps

1. Decide how "backlink secured" gets recorded. Likely candidates:
   - Manual: customer marks a prospect as "backlink live" somewhere in the
     dashboard once the founder gets a reply and the link goes up (this
     happens post-handoff, outside automation — see project CLAUDE.md:
     "Once a prospect replies, automation stops and the customer continues
     personally").
   - Automated: periodic check of the source URL for a link back to the
     product's domain (heavier lift, own ticket if pursued).
   Start with manual — cheapest to ship, and founders already know when
   they land one.
2. Add a `backlink_prospects` status/column for "won"/placed (or a
   dedicated small table if it needs a timestamp + URL evidence), plus a
   UI affordance to set it — likely near wherever prospect status/replies
   already surface in
   `apps/web/components/link-building/prospects/`.
3. Once real "won" data exists (needs a few weeks of accumulation before
   it's a meaningful sample), extend
   `.claude/skills/statistics-article/SKILL.md`'s query set and
   `apps/web/content/link-building-statistics/2026.ts` with: avg emails
   sent per secured backlink, median days from first contact to secured
   backlink, % of contacted prospects that convert to a backlink.
4. Surface the new numbers not just on the stats page but as an
   expectation-setter earlier in the funnel — e.g. pricing page or
   onboarding/welcome tour (ties into
   `todo/tickets/2026-08-24-explicit-outreach-send-transparency.md`) — since
   Ivan's ask was about setting expectations *before* judging results, not
   just having the numbers exist on a page he'd have to go find.
