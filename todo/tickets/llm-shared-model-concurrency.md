# Known issue: every scorer shares the same primary/fallback model, self-congestion likely cause of 07:00 UTC cascade

## Summary

Follow-up to the 07:00 UTC LLM fallback cascade (2026-07-20/21) — after the `openai/gpt-5.6-luna` 2nd-fallback fix shipped, dug into whether the root cause was actually an OpenRouter/provider outage. Evidence points at self-inflicted concurrency instead, which means the gpt-5.6-luna swap treats a symptom, not the likely root cause.

## Evidence

Full tally of every model attempt logged in the 07:04–07:17 UTC window (deploy `1ddfa0a9`):

| Model | Role | Attempts | Fails | Successes | Failure type |
|---|---|---|---|---|---|
| `z-ai/glm-4.7-flash` | primary | 8 | 8 | 0 | 100% `TimeoutError` |
| `qwen/qwen3.6-flash` | 1st fallback | 7 | 6 | 1 | 100% `Error: Provider returned error` — never a timeout |
| `deepseek/deepseek-v4-pro` | 2nd fallback (at incident time) | 6 | 3 | 3 | 100% `TimeoutError` |

Full 3-model exhaustion happened 3 distinct times in the window (confirmed via `attempt:` counters on separate `score-backlink-relevance`/`score-listicle-relevance` calls) — most of the time a fallback did catch it.

Each model has its own consistent, distinct failure signature (timeout vs explicit provider rejection) — not the uniform symptom you'd expect from one shared OpenRouter gateway incident. Checked OpenRouter's status page (status.openrouter.ai): no incidents reported for that window or these models.

**Root cause candidate: shared model, concurrent burst.** Every one of the 5 relevance scorers (`score-resource-page-inclusion.ts`, `score-listicle-relevance.ts`, `score-backlink-relevance.ts`, `score-mention-relevance.ts`, `score-site-relevance.ts`) *and* `build-listicle-queries.ts` all use `glm-4.7-flash` as primary and `qwen3.6-flash` as 1st fallback — zero diversification across call sites. `daily-backlink-discovery.ts:19` runs `PRODUCT_CONCURRENCY = 5` products in parallel; each strategy fires its own `pLimit(4-5)` concurrent batches internally. At the 07:00 UTC cron fire, that's potentially 20-25 simultaneous requests from a single API key all landing on `glm-4.7-flash` (and then `qwen3.6-flash`) at once — plausible self-rate-limiting/congestion, not a platform-wide outage.

## Why this matters for the gpt-5.6-luna fix

The shipped fix (swap 2nd fallback to a different provider) helps the tail case where all 3 already-shared models are congested — it's a real improvement. But if the actual driver is our own concurrency hammering 2 shared models, the fix doesn't address why glm/qwen degrade in the first place; it just gives the chain a 3rd, differently-congested-risk model to fall back to. If self-congestion is confirmed, the more direct fix is reducing concurrent pressure on any single model, not diversifying the fallback chain further.

## Recommendation (not yet actioned)

- Add a process-wide concurrency cap per model (mirror `scraper-limits.ts`'s shared `pLimit` pattern) so the 5 scorers + build-listicle-queries don't independently stack requests against `glm-4.7-flash` during a cron burst.
- Or: diversify *primary* models across scorers (not just fallbacks) so a burst doesn't concentrate on one model — e.g. alternate which scorer uses which model as primary.
- Before either: confirm the self-congestion theory with harder data — OpenRouter dashboard's per-model request/error-rate graph for 07:00-07:20 UTC (rate-limit responses vs timeouts) would settle whether this is us or the provider. Worth checking before investing in a concurrency-cap change.
