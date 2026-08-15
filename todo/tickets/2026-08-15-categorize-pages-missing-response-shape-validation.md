# Known issue: categorize-pages.ts throws a raw TypeError instead of validating the LLM response shape, silently drops the batch

## Summary

`apps/server/src/methods/product-pages/categorize-pages.ts:158` does `const byId = new Map(parsed.results.map((r) => [r.id, r]))` with no check that `parsed.results` exists before calling `.map()` on it. Observed in Railway `server` logs on 2026-08-15 (deployment `b6f0d6db-ce27-4a33-a841-e6aee01fb827`):

```
[categorize-pages] llm call failed, retrying { attempt: 1, delay_ms: 3000, error: "TypeError: Cannot read properties of undefined (reading 'map')" }
[categorize-pages] llm call failed, retrying { attempt: 2, delay_ms: 10000, error: "TypeError: Cannot read properties of undefined (reading 'map')" }
```

First at 03:17-03:18, again for a separate batch at 12:41-12:44 — same error text both times.

## Root cause

Every sibling method that parses structured LLM JSON validates the shape before touching it — `score-resource-page-inclusion.ts:175`: `if (!Array.isArray(parsed?.results)) throw new Error("missing results array")`, and `derive-niches.ts:75`, `score-backlink-relevance.ts:153`, `score-mention-relevance.ts:132`, `score-site-relevance.ts:99`, `score-listicle-relevance.ts:142` all throw a named `unexpected response shape: ...` error built from `Object.keys(parsed ?? {})`. `categorize-pages.ts:156-158` skips this guard entirely — it goes straight from `parseLlmJson<...>(text)` to `parsed.results.map(...)`. When the model's response doesn't include a `results` key, `.map()` throws an unguarded TypeError that carries no information about what was actually returned (no `rawResponse` logged, unlike the id-mismatch warn path two lines later at 174-180 which does log `rawResponse: text`).

`withLlmRetries` (`apps/server/src/helpers/llm-retry.ts:11-32`) retries on any thrown error indiscriminately by design, so this TypeError is treated the same as a transient timeout and retried 3 times (3s/10s/30s delays, ~43s total) before rethrowing — even though a malformed-shape response from the same prompt/payload is likely to fail identically on retry, not recover.

## Impact

`categorizeBatch`'s outer catch (`categorize-pages.ts:195-198`) swallows the rethrown error and returns `{ results: [], cost: 0 }` — the whole batch (up to `BATCH_SIZE = 15` pages) is silently dropped from categorization. Only a WARN log (`batch categorization failed`) is emitted; no page gets a `pageType`/`priority`/`keywords`, there's no user-facing signal, and nothing re-attempts those pages later. Observed twice in the same ~24h window with identical error text — a recurring pattern, not a one-off.

## Recommendation (not yet actioned)

Add the same `Array.isArray(parsed?.results)` guard the five sibling files already use, throwing a named `unexpected response shape` error (and logging `rawResponse: text` the way the id-mismatch path already does) before line 158's `.map()` call. That turns an opaque TypeError into the same diagnosable error class the rest of the codebase already retries and logs consistently, and preserves the actual malformed payload for debugging instead of losing it.
