# Feature idea: domain "leverage report" for when a prospect asks to be paid

## Problem

Some prospects reply to outreach asking for money in exchange for the backlink/guest
post placement. Once a prospect replies, Mentiohunt hands the conversation fully to
the founder (`apps/server/src/routes/prospect-reply.ts` — draft + send both require
the founder's own connected mailbox). Today the founder has nothing from Mentiohunt
to help them decide whether the asking price is reasonable, or any concrete
justification to push back with — they're negotiating blind.

## Idea

When a prospect's reply looks like a paid-placement ask, surface a short list of
negative signals about *their* domain — the kind of thing a founder could point to
in a reply to justify a lower price (or walking away):

- Pages not indexed by Google (we already build this exact check —
  `apps/server/src/methods/google-index/check-index.ts`, exposed as the free
  "index checker" tool)
- Low/declining organic traffic (`getBulkTrafficEstimation`, used in
  `apps/server/src/methods/backlinks/analyze-backlink-site.ts:45,58-59`)
- Low Domain Rating relative to what they're asking (`getDomainRating`, same file,
  already computed at discovery time for competitor-backlink prospects —
  `apps/server/src/methods/prospect-generation-methods/shared/enrich-domain-ratings.ts`)
- Thin backlink/referring-domain profile, or mostly nofollow links
  (`getBacklinksSummary`, `analyze-backlink-site.ts:43-44,66-75`)
- Other candidates worth exploring: stale content (no recent posts), spam-score /
  toxic-backlink signals, no organic keyword rankings, low domain age.

Most of the underlying data fetches already exist as building blocks
(`analyzeBacklinkSite`, `checkGoogleIndex`) — this would be a new method that runs
them for one prospect domain and turns the output into a plain-language, "here's
your leverage" summary rather than a raw metrics dump.

## Where it could surface

Likely the natural hook is the reply-drafting flow
(`prospectReplyRouter.post("/prospects/reply/draft", ...)`,
`apps/server/src/routes/prospect-reply.ts:193-284`) — e.g. detect a price ask in the
inbound message (or let the founder trigger it manually from the prospect's page),
run the leverage report, and feed the negative points into the
`systemInstructions` prompt so the drafted reply can reference them naturally
("your traffic estimate is X, most of your posts aren't indexed, so Z feels steep").

## Open questions (not decided yet — flagging for discussion)

- Manual trigger (founder clicks "analyze this domain") vs. automatic detection of a
  price ask in the inbound message via the existing reply-classification pipeline?
- Where does the report live — inline in the reply-draft UI only, or a persisted
  record on the prospect so it's visible any time the founder opens that
  conversation?
- Cost: each report means several Ahrefs/DataForSEO/Apify calls per prospect
  (`getDomainRating`, `getBacklinksSummary` x2, `getBulkTrafficEstimation`,
  Google SERP index check) — worth capping to on-demand only, not run for every
  prospect by default.
