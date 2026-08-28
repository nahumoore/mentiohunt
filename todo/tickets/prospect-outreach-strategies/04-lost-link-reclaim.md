# 04 — Lost-link reclamation (`lost_link_reclaim`)

- **Status:** Proposed — not started
- **Priority:** P2 (high-fit supplemental strategy, not a primary volume engine)
- **Depends on:** `todo/tickets/2026-08-27-fix-daily-opportunity-delivery.md`; the
  [enum checklist](README.md#enum-checklist-referenced-by-03-04-05)
- **Adds enum value:** `lost_link_reclaim`

## Why this one

The referring site already made an editorial decision to link to the customer once, so the pitch is
the warmest possible: "you used to link here, the link's gone, was that deliberate?" DataForSEO's
current backlinks endpoint already supports lost backlinks — no Moz restore needed. The pool renews
as links naturally decay, but small/new products may have little or nothing to reclaim, so this is
supplemental inventory on a measured cadence, not a daily engine.

## What exists today

- `apps/server/src/helpers/data-for-seo/get-backlinks.ts:46` hardcodes
  `backlinks_status_type: "live"`. The endpoint also accepts `"lost"`; nothing in the repo passes it.
- Nothing queries the **customer's own** domain's backlinks today — every current use targets a
  competitor.
- `broken-link-building/verify-live-link.ts` already implements "fetch a page and check whether a
  specific link is present" — the exact primitive reclamation needs.
- `unlinked-mention/` finds pages that mention the brand without linking — a lost link on a live page
  is frequently also an unlinked mention, so the two overlap.
- Cadence precedent: `shared/strategy-rotation.ts:254` `getBrokenLinkCadenceDecision`
  (`BROKEN_LINK_CADENCE_DAYS = 7`, `:30`) — a strategy that runs on a schedule rather than every
  rotation slot. `getUnrunnableReason` (`jobs/daily-backlink-discovery.ts:293-308`) is where a
  "nothing to reclaim" reason string goes. `DEFAULT_READY_PER_ATTEMPT`
  (`shared/strategy-rotation.ts:21-27`) needs a prior for the new type.

## Implementation

1. **New method** `methods/prospect-generation-methods/lost-link-reclaim/index.ts`. Query the
   customer's own domain's lost backlinks via a `backlinks_status_type: "lost"` path in
   `get-backlinks.ts` (add a `status` argument rather than a second function), with a bounded recent
   window (e.g. lost within the last 60–90 days) using supported filter fields.
2. **Verify each candidate:** fetch the source page and confirm (a) the page is live, and (b) the
   customer link is genuinely absent from it. Reuse `broken-link-building/verify-live-link.ts`.
3. **Split the two failure shapes:** a link removed from a still-live page is v1. A link lost because
   the whole source page 404s / is gone is **out of scope for v1** — there is no one to email.
4. **Prefer reclaim framing on overlap:** if the same URL also surfaces as an unlinked mention, treat
   it as a reclaim (stronger pitch) and suppress the duplicate unlinked-mention prospect.
5. **Cadence, not rotation:** schedule on a `getLostLinkCadenceDecision` modeled on
   `getBrokenLinkCadenceDecision`, with the interval driven by measured lost-link volume for the
   product (frequent for products losing many links, rare/skipped for products with none). Persist
   the skip reason in the daily summary; never show it as an unexplained daily skip.
6. **Enum + framing + web config** per the checklist. New `OutreachContext` variant
   `{ opportunityType: "lost_link_reclaim"; sourceUrl; sourceTitle; previousAnchor: string | null;
   previousTargetUrl; lostApproxDate: string | null }`; `buildFraming` branch: note the link used to
   be there, ask if removal was intentional, offer to update if the old URL is stale. Framing must
   describe `lostApproxDate` as "around when our crawler noticed it was gone", never an exact date.
   Alert email `send-lost-link-reclaim-alert.ts`, standard shape.
7. Route through `persistAndEnrich`. (Backlog table optional — volume is low; a per-run fetch is
   fine.)

## Safety constraints

- Only email about a link that verification confirms is currently absent from a currently-live page.
  A transient fetch failure is not "absent".
- Do not imply the removal was hostile or accuse the site; the pitch is a neutral check-in.
- Stay within the shared attempt / cost caps even though volume is expected to be low.

## Evaluation / success signal

Lower volume than competitor/listicle discovery but strong relevance, reply, and positive-reply
performance. Track: lost links found vs verified-absent-on-live-page, ready conversion, reply and
positive-reply rate, and how quickly the pool renews per product. Keep it on the cadence that its
measured renewal rate justifies.

## Tests

- A lost backlink whose source page 404s is excluded from v1.
- A lost backlink whose source page is live but no longer contains the customer link is accepted.
- A lost backlink whose source page still contains the customer link (DataForSEO lag / false
  positive) is rejected by verification.
- When a URL is both a lost link and an unlinked mention, one prospect is created with reclaim
  framing, not two.
- Cadence decision skips the strategy for a product with no recent lost links and records the reason
  in the daily summary.
- `lost_link_reclaim` is handled by persistence, sequencing, alerts, the five web maps, and the
  regenerated `prospect_tier` type.

## Relevant files

- `apps/server/src/helpers/data-for-seo/get-backlinks.ts`
- `apps/server/src/methods/prospect-generation-methods/lost-link-reclaim/` (new)
- `apps/server/src/methods/prospect-generation-methods/broken-link-building/verify-live-link.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/strategy-rotation.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts`
- `apps/server/src/methods/prospect-generation-methods/shared/persist-and-enrich.ts`
- `apps/server/src/jobs/daily-backlink-discovery.ts`
- `apps/web/lib/opportunity-types.ts`
- `packages/supabase/database-types.ts`
- `supabase/migrations/` (enum + backfill pair)

## Research references

- DataForSEO `backlinks_status_type` and lost-backlink filters:
  https://docs.dataforseo.com/v3/backlinks-backlinks-live/ ,
  https://docs.dataforseo.com/v3/backlinks-filters/
