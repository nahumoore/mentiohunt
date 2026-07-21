# Known issue: Ahrefs free DR endpoint returns unstable values

## Summary

`apps/server/src/helpers/ahrefs/get-domain-rating.ts` calls Ahrefs' public free Domain Rating endpoint (`GET https://api.ahrefs.com/v3/public/domain-rating-free`). Values stored in `backlink_prospects.domain_rating` at discovery time can differ significantly from the same domain queried later — same day, no code change in between.

Reported by alen@walletwallet.dev (product: pass2u.net) on 2026-07-21, complaining prospects showed inflated DR.

## Evidence

Compared `backlink_prospects.domain_rating` (captured 2026-07-20) vs live API value (checked 2026-07-21):

| domain | stored DR | live DR | gap |
|---|---|---|---|
| karlomeara.com | 39 | 0 | +39 |
| archive.lostinlogic.wickens.org.uk | 37 | 1.5 | +35.5 |
| ailternative.com | 40 | 12 | +28 |
| uscardforum.com | 52 | 32 | +20 |
| kkplay3c.net | 43 | 31 | +12 |
| beaconzone.co.uk | 45 | 35 | +10 |
| steachs.com | 48 | 39 | +9 |
| talk.macpowerusers.com | 45 | 43 | +2 |
| applealmond.com | 60 | 56 | +4 |
| d.pslot.io | 33 | 28 | +5 |
| partners.moengage.com | 55 | 78 | -23 |
| checkthat.ai | 38 | 58 | -20 |
| skycore.com | 24 | 35 | -11 |

Worst offenders (karlomeara.com, archive.lostinlogic.wickens.org.uk) are low-authority/near-dead sites — swings this large in one day aren't real DR movement, it's the free/unauthenticated tier returning inconsistent values for low-authority domains.

Confirmed the instability isn't an auth problem: added `AHREFS_API_KEY` (Bearer token, required by the endpoint from 2026-08-10 per the API's own `warning` field) and re-queried the same domains — identical numbers to the unauthenticated call, just no warning field. Auth doesn't fix accuracy.

Separate, smaller issue same file: `normalizeTarget()` keeps the full hostname (subdomain included), but Ahrefs DR is a root-domain metric — querying a subdomain (e.g. `partners.moengage.com`, `d.pslot.io`) returns the parent root domain's DR, not something specific to the subdomain. Not wrong, but can read as misleading since it implies subdomain-level authority.

## Fix applied so far

- `get-domain-rating.ts` now sends `Authorization: Bearer ${AHREFS_API_KEY}` (env var added to `apps/server/.env.local`). Silences the deprecation warning, does not fix the underlying instability.

## Recommendation (not yet actioned)

Switch DR source to DataForSEO Backlinks API `Bulk Ranks` endpoint (`/v3/backlinks/bulk_ranks/live/`):
- ~$0.002/domain (batch up to 1000 domains/subdomains per request)
- ~$0.60 one-time to refresh all 299 current `backlink_prospects` rows; ongoing cost negligible
- Returns DataForSEO's own PageRank-style "Rank" (0–100 or 0–1000 scale via `rank_scale`), not literally Ahrefs' trademarked Domain Rating — if swapped, relabel UI/copy away from "DR" (e.g. "authority score") so we're not presenting a different metric as Ahrefs DR

Worth doing: DR feeding an unstable number undercuts the product's "fit rationale, not just domain metrics" positioning (see CLAUDE.md) — a founder who catches an inflated/wrong DR loses trust in the whole opportunity queue, not just that one field.
