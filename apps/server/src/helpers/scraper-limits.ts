import pLimit from "p-limit"

/**
 * Process-wide caps on in-flight requests to the scraper service, shared across
 * every discovery run, onboarding job, and cron tick. Without this, overlapping
 * runs multiply their per-run pLimits (daily job: 3 products x pLimit(3), plus
 * onboarding) and pile up in the scraper's queue, where waiting time burns the
 * caller's AbortSignal budget and requests time out client-side while still
 * queued server-side.
 *
 * Queueing here instead is free: the abort timeout is created inside the
 * limited callback, so it only starts ticking once the request actually holds
 * a slot.
 *
 * Sized to match the scraper's own pools (SCRAPE_HEAVY_CONCURRENCY /
 * SCRAPE_LIGHT_CONCURRENCY in apps/scraper/core.py) — keep the two in sync.
 *
 * heavy: /agent-scrape, /check-mention — multi-page browser crawls, up to ~2 min
 * light: /byline-scrape, /fetch-content — single tiered fetch, seconds
 */
const HEAVY_CONCURRENCY = Number(process.env.SCRAPER_HEAVY_CONCURRENCY ?? 10)
const LIGHT_CONCURRENCY = Number(process.env.SCRAPER_LIGHT_CONCURRENCY ?? 16)

export const scraperHeavyLimit = pLimit(HEAVY_CONCURRENCY)
export const scraperLightLimit = pLimit(LIGHT_CONCURRENCY)
