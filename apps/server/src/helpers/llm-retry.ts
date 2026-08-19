import { LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import type { createLogger } from "./logger.js"
import { sendLowCreditsAlertEmail } from "./emails/send-low-credits-alert.js"

export const LLM_RETRY_DELAYS_MS = [3_000, 10_000, 30_000]

// Module-level so it's shared across every call site and every batch within
// a burst of parallel runs — without this, one bad OpenRouter balance dip
// during a busy discovery tick would fire dozens of identical alert emails.
const LOW_CREDITS_ALERT_COOLDOWN_MS = 30 * 60 * 1000
let lastLowCreditsAlertAt = 0

function maybeAlertLowCredits(err: unknown): void {
  if (!(err instanceof LlmAllModelsFailedError)) return
  if (!err.attemptErrors.some((e) => e.includes("Insufficient credits"))) return

  const now = Date.now()
  if (now - lastLowCreditsAlertAt < LOW_CREDITS_ALERT_COOLDOWN_MS) return
  lastLowCreditsAlertAt = now

  void sendLowCreditsAlertEmail(err.message)
}

/**
 * Retries an LLM call (and whatever parsing happens inside it) on any thrown
 * error — timeouts, provider errors, rate limits, and bad JSON all look like
 * transient blips in practice, so there's no reliable way to tell them apart
 * from the error string alone. Rethrows the last error once delays run out.
 *
 * When every model fails on "Insufficient credits" (see
 * LlmAllModelsFailedError), this also fires a one-off alert email — that
 * failure otherwise surfaces only as a run silently completing with 0
 * qualified prospects, indistinguishable from a genuinely bad niche.
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

  maybeAlertLowCredits(lastErr)
  throw lastErr
}
