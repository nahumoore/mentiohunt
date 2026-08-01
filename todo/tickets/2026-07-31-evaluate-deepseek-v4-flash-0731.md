# Evaluate deepseek/deepseek-v4-flash-0731 as a scoring model before adopting anywhere

**Status: Research done, not adopted.** Ran a manual A/B test comparing `deepseek/deepseek-v4-flash-0731` (new, released 2026-07-31) against `deepseek/deepseek-v4-pro` (current `DEFAULT_GENERATE_TEXT_MODEL`) on real site-relevance scoring cases. Model constant and test script were added and then reverted per request — nothing changed in the shipped code. This ticket preserves the findings so the eval doesn't need to be redone from scratch.

## Setup

Model: `deepseek/deepseek-v4-flash-0731` — sparse MoE, 13B active / 284B total params. Pricing: $0.14 / 1M input, $0.28 / 1M output (vs `deepseek-v4-pro`'s $0.435 / $0.87 — roughly 3x cheaper on paper).

Test: reran the exact prompt/schema from `score-site-relevance.ts` (product-fit scoring, 0-100) against real `backlink_prospects` rows already scored in prod, comparing fresh output from both models side by side against the stored prod score. Scoped to `tier = resource_page_inclusion` since it's the only tier where the original title + relevance-reason snippet survives in `raw_metadata` post-enrichment — other tiers (`unlinked-mention`, `listicle-roundup`, `competitor-backlink`) drop that data during enrichment, so their original scoring inputs aren't reconstructable from the DB.

## Findings

**Cost:** confirmed cheaper in practice, not just on paper — flash ran at roughly 1/8th the cost of pro across every run (cost ratio ~0.12-0.14), even better than the sticker-price ~3x, likely due to shorter completions.

**Latency:** flash was consistently slower — 2-2.2x pro's average response time (e.g. 18.7s vs 8.4s avg in one run). Also hit hard 60s timeouts in 2 early runs (2/20 requests) before the script's `timeoutMs` was bumped to 120s, after which 0 timeouts occurred in a 40-sample run. Given the model shipped literally the day of testing (2026-07-31), this reads as day-one provider capacity, not a settled steady-state — worth re-checking speed in a few weeks rather than treating it as permanent.

**Output quality (cross-account, n=40, general sample):** roughly a wash. Comparing each model's fresh score against the existing prod-stored score: pro closer in 16/40, flash closer in 15/40, tied in 9/40 — statistically a coin flip. Avg absolute score diff between the two models: 11.0 points (0-100 scale). Notably, pro's *own* fresh run also diverges from its *own* past stored score by similarly large margins on several rows — this scoring task has real inherent noise independent of which model runs it.

**Output quality (Mentiohunt's own real prospects, n=4 — small):** thin sample (see caveat above — most of the user's own prospects don't have reconstructable original scoring input). All 4 available samples showed flash scoring *higher* than pro: +5, +20, +5, 0. One meaningful miss — `bluethings.co`, prod/pro both ~60-62, flash jumped to 82. Directionally consistent with (not contradicted by) the broader cross-account sample, but n=4 is too thin to conclude flash systematically inflates scores — flagged as a "watch for this" if adopted, not a confirmed defect.

## Recommendation

Not adopted yet. Cost win is real and substantial (~8x), and cross-account quality looks comparable overall — but:
- Latency/timeout behavior should be re-tested in a few weeks once the model is past launch-day capacity constraints, since latency matters even though this specific eval was scoped to ignore it.
- The small owner-scoped sample hints at score inflation on the high end — worth a larger same-product sample before trusting it on a single customer's real pipeline.
- Only `score-site-relevance.ts`'s prompt/schema was tested. Other deepseek call sites (`build-listicle-queries.ts`, `generate-competitors.ts`, `derive-niches.ts`, `categorize-pages.ts`, `score-mention-relevance.ts`, `score-resource-page-inclusion.ts`, `score-listicle-relevance.ts`) have different prompts and were not evaluated — don't generalize this result to those without a similar test.

If revisiting: re-add `DEEPSEEK_DEEPSEEK_V4_FLASH_0731` to `packages/openrouter/models.ts` and rebuild a comparison script pulling real `backlink_prospects` rows (see git history around 2026-07-31 for the reverted version) — pattern is straightforward to recreate.
