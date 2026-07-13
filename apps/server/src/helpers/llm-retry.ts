import type { createLogger } from "./logger.js"

export const LLM_RETRY_DELAYS_MS = [3_000, 10_000, 30_000]

/**
 * Retries an LLM call (and whatever parsing happens inside it) on any thrown
 * error — timeouts, provider errors, rate limits, and bad JSON all look like
 * transient blips in practice, so there's no reliable way to tell them apart
 * from the error string alone. Rethrows the last error once delays run out.
 */
export async function withLlmRetries<T>(
  log: ReturnType<typeof createLogger>,
  fn: () => Promise<T>,
  retryDelaysMs: number[] = LLM_RETRY_DELAYS_MS
): Promise<T> {
  let lastErr: unknown

  for (let attempt = 0; attempt <= retryDelaysMs.length; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastErr = err
      if (attempt < retryDelaysMs.length) {
        const delay = retryDelaysMs[attempt]!
        log.warn("llm call failed, retrying", { attempt: attempt + 1, delay_ms: delay, error: String(err) })
        await new Promise((resolve) => setTimeout(resolve, delay))
      }
    }
  }

  throw lastErr
}
