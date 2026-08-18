# Backlink prospect relevance quality — Ivan Fedyanin (Fluentessa) feedback

## Background

Email from `ivan.a.fedyanin@gmail.com` (Fluentessa, `products.id = 4d7b6fa6-01a2-41d8-affa-acede680cd05`):

> I have looked at the opportunities, but I did not like them. For example, fluentu.com
> and copycatcafe.com — their are my competitors, and in their blog they usually write
> only posts mostly about their apps, sometimes comparing them to their well known
> competitors. There is no reason for them to add the link to fluentessa. Overall, I got
> better results by searching links with Claude, by telling it what exactly I need, and
> even after that I had to correct it's direction multiple times. But anyway, thanks for
> your outreach. I liked the email suggestions your tool generated.

Fluentessa: annotated French books for English speakers learning French (inline English
translations, browser reader). `dr_min=5`, `dr_max=60`.

## Investigation findings

Pulled all 36 stored prospects for this product across its 3 discovery runs
(`competitor_backlink` against lingq/readlang/storylearning/lingopie/interlinearbooks/
beelinguapp, and `listicle_roundup`). Two confirmed bugs, plus two more quality gaps found
while reviewing the full batch (not yet fixed):

1. **DR ceiling silently not enforced (`competitor_backlink` only) — FIXED.**
   `filter-backlinks.ts` filters on DataForSEO's own rank scale (returned free with the
   backlink data) as an early, cheap cut. The real Ahrefs DR — the number actually shown to
   the user and compared against their `dr_min`/`dr_max` setting — was only fetched right
   before insert, in `process-competitor.ts`, and was **never re-checked against the
   setting**; whatever Ahrefs returned got stored as-is. fluentu.com (Ahrefs DR 74) slipped
   through Ivan's DR-60 ceiling this way. Not a one-off — same batch: `idiominsider.com`
   (DR81), `lbb.in` (DR73), `educationalappstore.com` (DR70), `antimoon.com` (DR61). The
   other 3 discovery strategies (`listicle_roundup`, `unlinked_mention`,
   `resource_page_inclusion`) already re-filter correctly; only `competitor_backlink` had
   the gap.

2. **Relevance scoring has no "competitor's own blog" signal — PARTIALLY FIXED.**
   Neither relevance scorer had any concept of "this site is itself a competing product's
   marketing blog that only promotes its own tool and links to well-known incumbents, not
   smaller/newer alternatives" — exactly Ivan's complaint. copycatcafe.com scored 92/100 on
   pure topic/audience fit despite being exactly that.
   - Fixed in `score-listicle-relevance.ts` (the actual 1-5 gate for `listicle_roundup`) —
     verified live: copycatcafe.com's score dropped 92→2/5, reason returned by the model:
     *"Company blog promoting its own tool; likely only lists well-known competitors, so
     adding a smaller reading tool is unlikely."* This now correctly blocks insertion for
     that strategy.
   - Fixed in shared `score-site-relevance.ts` too, but **this does not gate anything for
     `competitor_backlink`** — its output (`site_relevance_score`) is stored on the row for
     display only; the real insertion gate for that strategy is a separate scorer,
     `score-backlink-relevance.ts` (1-5 scale, page/pageType fit only), which still has no
     competitor-ownership signal. Confirmed via `fakulteti.mk`, which scored 5/100 on the
     informational scorer yet was still inserted — proof the display score isn't a gate.
     **Not yet fixed for competitor_backlink — see next steps.**

3. **Wrong-language/locale mismatch — NOT FIXED.** `competitor_backlink` pulls every
   backlink to a competitor domain with no check that the linking page is actually about
   French. Fluentessa's competitors (lingq, storylearning, readlang) serve all languages, so
   their backlink profiles are full of unrelated-language content: `slev.life` (Serbian),
   `fakulteti.mk` (Macedonian), `goeastmandarin.com` (Chinese), `germanlistening.com` /
   `hitalki.org` (German), `extension.vn` (Vietnamese). 6 of 36 prospects.

4. **Non-editorial / automated pages — NOT FIXED.** Forum threads and auto-generated
   directory pages have no real site owner to email and near-zero chance of a manual link
   ever being added, regardless of topical fit: `forum.lingq.com`, `tildes.net`,
   `antimoon.com` (forum threads); `justuseapp.com`, `ailternative.com` (×2),
   `askaiforit.com`, `makerlist.io`, `educationalappstore.com` (auto-generated AI-tool/app
   directories). ~8 of 36 prospects.

**Genuinely good prospects for contrast** (real, on-topic, editorial third-party sites):
`feelgoodfrench.com`, `lindsaydoeslanguages.com`, `fluentlanguage.co.uk`, `refold.la` (×2),
`outilstice.com`, `mmecaroline.com`, `french-exam.com`.

## Changes made (uncommitted)

- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/process-competitor.ts`:
  Ahrefs DR lookup + `dr_min`/`dr_max` re-filter moved to immediately after the cheap
  DataForSEO-scale filter, before either LLM relevance pass — fixes bug 1, and as a side
  effect stops paying for relevance-scoring/enrichment on prospects that get DR-rejected
  anyway.
- `apps/server/src/methods/prospect-generation-methods/listicle-roundup/score-listicle-relevance.ts`:
  added "competing product's own blog" disqualifier to the score-2 tier of the actual
  `listicle_roundup` gate.
- `apps/server/src/methods/prospect-generation-methods/shared/score-site-relevance.ts`: same
  disqualifier added (caps score at 20), but as noted in finding 2, this only has real effect
  for `listicle_roundup` right now — no effect on `competitor_backlink`.

**Verified via live dry run** against the exact failing URLs (no DB writes): fluentu.com DR
74 → now filtered by the DR fix; copycatcafe.com listicle score 92→2 → now filtered by the
listicle fix.

## Next steps

1. ~~Add the same "competitor's own blog" disqualifier to
   `competitor-backlink/score-backlink-relevance.ts`~~ — **done**, combined with 2 and 3
   below in a single prompt update (see Changes made).
2. ~~Add a language/locale-match check to the same gate~~ — **done**.
3. ~~Add a page-type disqualifier for forum threads and auto-generated directory/aggregator
   pages~~ — **done**.
4. Commit + ship all of the above, then decide whether to retroactively clean up (dismiss)
   the already-inserted bad prospects still sitting as `status = new` on Ivan's account.

## Changes made, part 2 (uncommitted)

- `apps/server/src/methods/prospect-generation-methods/competitor-backlink/score-backlink-relevance.ts`:
  extended the score-2/score-1 tiers of the actual `competitor_backlink` gate to cover all
  three remaining gaps at once — competitor's-own-blog, language/locale mismatch, and
  forum/auto-generated-directory pages with no reachable editor.

**Verified via live dry run** (real fetched page content, no DB writes) against 4 items
built from this product's actual failed/good prospects:

| Domain | Before | After | Notes |
|---|---|---|---|
| fluentu.com | inserted (relevance-scorer had no signal) | score 2, rejected | "roundup of Spanish Reading Apps... irrelevant to the Spanish audience" — language mismatch caught it even before the competitor-blog rule needed to |
| fakulteti.mk | inserted (score 5/100 on the non-gating scorer) | score 2, rejected | Macedonian-language mismatch |
| askaiforit.com | inserted | score 1, rejected | "auto-generated tool directory listing... no identifiable human editor" |
| lindsaydoeslanguages.com (known-good) | passing | score 4, still passing | confirms no false-positive regression on a genuine third-party blog |

## Status

Done and dry-run verified: DR fix, listicle-relevance gate fix, and competitor_backlink
gate fix (all 3 remaining findings folded into one prompt change). All uncommitted.
Remaining: decide on retroactive cleanup of already-inserted bad prospects (next step 4),
then commit.
