# Outreach email quality issues: broken greetings, boilerplate follow-ups, ignored em-dash rule

## Summary

Analyzed real generated sequences in `backlink_prospects` + `prospect_sequences`
(634 prospects, 1731 sent/queued emails) on 2026-07-30. Three confirmed quality issues in
the outreach generation path (`apps/server/src/methods/prospect-generation-methods/shared/generate-outreach-sequence.ts`
and `apps/server/src/methods/prospect-generation-methods/competitor-backlink/contact-validation.ts`).

## Issue 1 — Contact-name sanitizer lets scraper garbage into the greeting

`sanitizeContactName` (`contact-validation.ts:77`) only blocklists a short list of known-bad
tokens (`null`, `admin`, `team`, etc.) plus a length/word-count cap. It has no check for
newlines, domain suffixes, or non-person entity names, so these ship as real sent emails:

- `contact_name = "Service\nBranding\nIndustry\nArtificial"` (bluetext.com, nav-menu scrape
  leakage) → email opens **"Hi Service,"**
- `contact_name = "Us\nPitchbox\nBot\nVisit"` (makerlist.io — scraped off another outreach
  tool's widget) → **"Hi Us,"**
- Domain-as-name: `"FYIcenter.com"`, `"ailternative.com"`, `"ImageLabGraphics.com"` → **"Hi
  FYIcenter.com,"**
- Company/brand names pass through untouched: `"Panasonic"`, `"Amopictures Limited"` → **"Hi
  Amopictures,"**; `"姚瑶- 倍可亲Backchina LLC"` → **"Hi 姚瑶-,"**

13/634 prospects have literal newlines in `contact_name`; 12/634 have a domain-like token as
the "name." Small % of volume, but each is a real sent email that reads as bot-generated to
the recipient — directly undermines the "founder-to-founder, not an agency" positioning.

**Fix direction:** harden `sanitizeContactName` to reject newlines, domain-suffix strings
(`.com`/`.io`/etc.), and known non-person patterns (LLC/Ltd/Inc/Group/Team suffixes).

## Issue 2 — Follow-up emails (step 2 & 3) collapse into near-identical boilerplate

Across 577 generated sequences: step1 bodies are 560/577 distinct (well personalized), but
step2 and step3 are only 417/577 distinct each — **~28% are exact duplicates**, differing only
by sender first name, across totally unrelated domains/topics.

Verbatim step2 body sent for 14+ unrelated prospects (self-care roundup, happiness roundup,
meditation piece, Zen-monk piece, ERP guide, etc.):

> "Wanted to add one more reason this might be worth a look: if the page is still maintained,
> a small update can make it more useful for readers without needing a rewrite."

Step3 collapses the same way onto:

> "Last note from me. If the page is not being updated anymore, no worries at all. ... P.S. No
> hard feelings if it's not a fit, I won't follow up after this."

This happens even when the product's `<offering>` field lists 4 distinct items (Trustpilot/G2
review, testimonial, guest-post swap, social shoutout) that step2/3 are explicitly instructed
to rotate through and lead with (`generate-outreach-sequence.ts:164-175`) — none of the sampled
step2/3 bodies reference the offering at all. The instructions for email 2/3 give the model far
less situational material to anchor on than email 1's framing, so it defaults to generic filler
at scale — undermining the sequence's escalating-value premise for 2 of every 3 emails.

**Fix direction:** strengthen step2/3 prompt to force referencing prospect-specific context
(page title/anchor) and mandate offering rotation; consider a duplicate-body check with retry.

## Issue 3 — "No em-dashes" rule ignored in ~30% of emails

System prompt states "No em-dashes, no bullet points, no corporate language"
(`generate-outreach-sequence.ts:154`), but 527 of 1731 stored bodies (30%) contain an em-dash
anyway, e.g.:

> "P.S. — Respect the digital nomad hustle."
> "P.S. — saw you're an animal lover and sports enthusiast."

The file already has precedent for not trusting the model on formatting rules — `ensureSignOff`
(lines 59-66) deterministically backfills a dropped sign-off instead of relying on the prompt
alone — but no equivalent strip/replace step exists for em-dashes.

**Fix direction:** add a deterministic post-process (replace `—` with `,` or `.` as
appropriate) alongside `ensureSignOff`, same pattern already used for sign-offs.

## Non-code note (separate from above, needs a product decision, not a fix)

`backlink_prospects_settings.offering` for at least one live product (Elevation Vibe) includes:

> "A genuine Trustpilot or G2 review of their product ... in exchange for [a link/mention]"

This is an incentivized-review offer tied to a link ask — against Trustpilot/G2 review-policy
and reads as a link-scheme if actually swapped. Worth deciding whether this offering type
should be allowed/suggested at all, independent of the code issues above.

## Recommendation (not yet actioned)

- Harden `sanitizeContactName` (Issue 1).
- Strengthen step2/step3 prompt instructions + add anti-boilerplate check (Issue 2).
- Add em-dash post-process backstop next to `ensureSignOff` (Issue 3).
- Flag the Trustpilot/G2 incentivized-review offering to product for a policy call.
