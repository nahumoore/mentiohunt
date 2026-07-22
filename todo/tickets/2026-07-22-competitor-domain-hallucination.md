# Known issue: LLM-hallucinated competitor domains reach DataForSEO unvalidated

## Summary

`apps/server/src/methods/prospect-generation-methods/competitor-backlink/index.ts:45` (`discoverCompetitorBacklinks`) reads `product.competitors` straight from the DB and maps each entry through `extractCompetitorDomain` (`extract-backlinks.ts:6-16`), which only does `new URL(...).hostname` — strips protocol/`www.`/path, does not check the TLD is real. `getBacklinks` (`apps/server/src/helpers/data-for-seo/get-backlinks.ts:28-63`) then passes that `target` straight into DataForSEO's `backlinks/backlinks/live` request body with zero validation.

On 2026-07-22 ~07:02:59 UTC, `extract-competitor-backlinks` logged `backlink fetch failed` for three garbled domains in one product's competitor list: `pwoetwkt.con`, `pwrp.con`, `poert.con` — DataForSEO rejected all three with `Error: DataForSEO task error 40501: Invalid Field: 'target'`.

## Root cause

These aren't user typos — they're LLM hallucinations from onboarding. `apps/web/app/api/onboarding/generate/competitors/route.ts` asks an LLM to suggest "8 to 10 unique root domains of real products" (plain `generateText`, no `json_schema` mode — JSON pulled out via regex, lines ~32-39/66-67). The only guardrail is a Zod shape check, `z.array(z.string().min(3)).min(8).max(10)` (line 9-10) — length and type, not domain plausibility.

Client-side, `competitorUrlSchema = z.string().transform(normalizeUrl).pipe(z.string().url())` (`apps/web/consts/onboarding.ts:139-144`) is the only other check before the value is saved. `z.string().url()` validates URL *syntax* only — `https://pwoetwkt.con` parses as a perfectly valid URL, so a garbled/hallucinated TLD sails through untouched. `onboarding-wizard.tsx:147` writes the AI's suggestions directly into form state without any per-string re-validation beyond that.

So a bad string can enter at generation time (LLM invents a non-existent domain) and nothing downstream — not the onboarding form, not `extractCompetitorDomain`, not `get-backlinks.ts` — ever checks it resolves to something real before it's persisted to `products.competitors` and later burned on a DataForSEO call.

## Impact

Not a flaky-infra issue — this is a real, unaddressed gap. Every discovery run for an affected product wastes a DataForSEO call per garbled domain (recurring cost, not one-off) and silently loses that competitor's backlink data for the run (caught per-domain in `extractBacklinks`, `log.warn` + skip — no crash, no alert, no user-visible signal that a chunk of their competitor list is dead weight). Directly undercuts discovery quality for whichever product got a bad onboarding suggestion, indefinitely, until the user manually notices and edits their competitor list.

## Recommendation (not yet actioned)

Need a better competitor-generation approach, not just a validation patch — current one-shot `generateText` + regex-JSON extraction has no grounding, so it hallucinates plausible-looking but fake domains with no way to catch it after the fact from string shape alone. Options to evaluate:

- **Grounding fix (root cause):** swap the LLM-only suggestion step for something that verifies existence — e.g. have the LLM propose company/product *names*, then resolve each to a real domain via a search API (SERP/Apify actor already used elsewhere in this codebase) or a WHOIS/DNS existence check, rather than trusting the LLM to output a correct domain string directly.
- **Structured output:** move off regex-extracted JSON to proper `json_schema` mode (consistency with how other LLM call sites in this codebase should behave) — reduces malformed output but doesn't by itself fix hallucinated-but-well-formed fake domains.
- **Defensive validation (cheap, still worth doing regardless of the above):** add a real-TLD/plausibility check (e.g. public suffix list) plus a DNS resolution check before a competitor domain is persisted in onboarding, and again defensively in `get-backlinks.ts`/`extractCompetitorDomain` before spending a DataForSEO call on it.
- Same recurring "no validation at the trust boundary between LLM output and a paid third-party API call" shape as other tickets in this set — worth deciding whether onboarding's LLM-suggestion flows in general need a shared validation layer.
