# Known issue: every scorer shares the same primary/fallback model, self-congestion likely cause of 07:00 UTC cascade

**Status: Completed (2026-07-21)** — shipped a process-wide per-model concurrency cap (default 8, `LLM_MODEL_CONCURRENCY`-tunable) in `packages/openrouter/generate-text.ts`, keyed by model ID so it covers every scorer and every model in the fallback chain without touching call sites. Follow-up: confirm via OpenRouter's per-model dashboard graph on a future 07:00 UTC window that failure rate actually drops.

**Update (2026-07-23):** Still happening. 07:00 UTC window same day logged `glm-4.7-flash` primary timeout → `qwen3.6-flash` fallback `Provider returned error`, same signature as original incident, cap notwithstanding. Cap alone hasn't resolved it — need the OpenRouter per-model dashboard check (see Recommendation) to tell whether cap value (8) is still too high for this window's burst size, or whether congestion isn't self-inflicted after all.

**Update (2026-07-24):** Researched how OpenRouter's provider routing actually works before changing anything further, since the cap had zero measurable effect on the 07-23 recurrence. Then actioned the Recommendation's 2nd bullet: diversified *primary* models across all 6 shared call sites (`score-backlink-relevance.ts`, `score-mention-relevance.ts`, `score-listicle-relevance.ts`, `score-resource-page-inclusion.ts`, `score-site-relevance.ts`, `build-listicle-queries.ts`), which previously all used `glm-4.7-flash` primary / `qwen3.6-flash` 1st fallback with zero variation. New split keeps both proven models and adds `deepseek/deepseek-v4-pro` as a third rotation slot (team preference — no Gemini/Claude): `glm-4.7-flash`, `qwen3.6-flash`, and `deepseek-v4-pro` each now anchor 2 of the 6 call sites, so a 07:00 UTC burst spreads across 3 providers instead of concentrating entirely on the 2 that failed in the original incident. `openai/gpt-5.6-luna` stays the shared last-resort fallback everywhere, unchanged. Caveat: `deepseek-v4-pro` isn't a clean bill of health — it was the 2nd-fallback in the original 07:04-07:17 tally and still failed 3/6 times there (also `TimeoutError`), so this is a diversification move, not a swap to an obviously-safer model.

### Research (2026-07-24): why this probably isn't (only) self-congestion

General OpenRouter behavior (docs): rate limits/provider errors are almost always inherited from the upstream provider, not an OpenRouter-account-wide ceiling ([rate limits docs](https://openrouter.ai/docs/api_reference/limits)); OpenRouter does automatic provider-level failover by default (`allow_fallbacks: true`) when a provider serving a model is rate-limited or down ([provider routing guide](https://openrouter.ai/docs/guides/routing/provider-selection)); and our request body sets `provider.require_parameters: true` on every call, which restricts routing to only providers that support every parameter we send (`response_format: json_schema` + `reasoning`, since scorers pass `thinkingBudget`) — this can shrink a model's eligible pool.

Confirmed against real data — queried OpenRouter's public `/api/v1/models/{author}/{slug}/endpoints` API directly (read-only, no generation cost) for every model in the fallback chain, filtering for providers that support both `structured_outputs` and `reasoning` (our `require_parameters: true` filter) and are currently healthy:

| Model | Eligible providers | Notes |
|---|---|---|
| `qwen/qwen3.6-flash` | **1** (Alibaba) | Only provider on OpenRouter at all — it's Alibaba's own model, not rehosted elsewhere. Zero redundancy, full stop. |
| `z-ai/glm-4.7-flash` | **2** (DeepInfra, Cloudflare) | 2 more excluded: Novita doesn't support `structured_outputs`, Venice is flagged unhealthy (negative `status`) independent of our filter. |
| `deepseek/deepseek-v4-pro` | **7+** healthy | Deep pool. |
| `openai/gpt-5.6-luna` (shared last-resort fallback) | **5** healthy (OpenAI ×3, Azure ×2) | Deep pool, as originally designed. |

This resolves the ambiguity: qwen's uniform "Provider returned error" is its *one* provider rejecting under load — there's no second provider for OpenRouter to fail over to. glm's uniform `TimeoutError` is its 2 providers getting saturated. A flat concurrency cap of 8 (shipped 07-21) was sized without regard to this — 8 concurrent requests is nothing to deepseek's 7-provider pool but can outright saturate a model with exactly 1 provider. That's why the cap had zero measurable effect on 07-23: it wasn't capping the actual bottleneck.

**Fix (2026-07-24):** replaced the flat per-model cap in `packages/openrouter/generate-text.ts` with per-model overrides sized to each model's real provider depth — `qwen3.6-flash` capped at 2, `glm-4.7-flash` at 3, everything else (deepseek, luna, etc.) stays at the default 8. Also diversified *primary* models across the 6 shared call sites (previously all 6 used `glm-4.7-flash` primary / `qwen3.6-flash` 1st fallback with zero variation) — `glm-4.7-flash`, `qwen3.6-flash`, and `deepseek-v4-pro` (team preference, no Gemini/Claude) each now anchor 2 of the 6. `openai/gpt-5.6-luna` stays the shared last-resort fallback everywhere, unchanged. Since the concurrency cap is process-wide per model ID regardless of which call site triggers it, the cap override protects qwen/glm's thin pools even where they're used as fallback rather than primary.

Still not actioned: relaxing `require_parameters` to see if it widens glm's pool. Given the real data, this is now lower-priority than it looked — Novita is independently flagged unhealthy regardless of our filter, so relaxing the flag likely wouldn't recover much for glm, and doing so trades away the guarantee that a provider won't silently drop structured output/reasoning. Not worth it based on what we now know.

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
