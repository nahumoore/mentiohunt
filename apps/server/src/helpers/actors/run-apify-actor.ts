import pLimit from "p-limit"
import { createLogger } from "../logger.js"
import { LLM_RETRY_DELAYS_MS } from "../llm-retry.js"

const log = createLogger("apify-actor")

/**
 * Process-wide cap on in-flight Apify actor calls, shared across every
 * caller (SERP, email verification, etc). Cron bursts stack their own
 * per-run pLimits on top of each other (e.g. 5 products x pLimit(3) = up
 * to 15 simultaneous calls) and can overwhelm the actor's own capacity —
 * this bounds that regardless of how many callers fire at once.
 */
const APIFY_CONCURRENCY = Number(process.env.APIFY_CONCURRENCY ?? 8)
const apifyLimit = pLimit(APIFY_CONCURRENCY)

class ApifyActorError extends Error {
  constructor(public readonly status: number, message: string) {
    super(message)
  }
}

async function fetchOnce<T>(actorId: string, input: unknown, timeoutSec: number): Promise<T> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${token}&timeout=${timeoutSec}`
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout((timeoutSec + 60) * 1000),
  })
  if (!res.ok) {
    let body = ""
    try { body = await res.text() } catch { /* ignore */ }
    throw new ApifyActorError(res.status, `Apify ${res.status}: ${res.statusText}${body ? ` — ${body}` : ""}`)
  }
  return res.json() as Promise<T>
}

/**
 * Retries transient failures (5xx, network errors, timeouts) with backoff —
 * mirrors withLlmRetries's shape (apps/server/src/helpers/llm-retry.ts).
 * 4xx errors (bad input) are not retried since retrying won't fix them.
 */
export async function runApifyActor<T>(
  actorId: string,
  input: unknown,
  timeoutSec = 300,
  retryDelaysMs: number[] = LLM_RETRY_DELAYS_MS
): Promise<T> {
  let lastErr: unknown

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    try {
      return await apifyLimit(() => fetchOnce<T>(actorId, input, timeoutSec))
    } catch (err) {
      lastErr = err
      const isClientError = err instanceof ApifyActorError && err.status >= 400 && err.status < 500
      if (isClientError || attempt === retryDelaysMs.length) break

      const delay = retryDelaysMs[attempt]!
      log.warn("apify actor call failed, retrying", {
        actorId,
        attempt: attempt + 1,
        delay_ms: delay,
        error: String(err),
      })
      await new Promise((resolve) => setTimeout(resolve, delay))
    }
  }

  throw lastErr
}
