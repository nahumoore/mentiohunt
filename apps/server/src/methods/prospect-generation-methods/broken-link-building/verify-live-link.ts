import { fetchWithRetry } from "../../../helpers/http.js"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("verify-live-link")

/**
 * DataForSEO's backlink index lags — the dead link found there may already
 * be fixed or the linking page rewritten. Before pitching a replacement,
 * confirm the dead URL is still literally present on the live page. Plain
 * HTTP (not the scraper service) — this is a cheap presence check, not a
 * render, so it doesn't consume scraper-pool slots.
 */
export async function verifyLiveLink(urlFrom: string, deadUrl: string): Promise<boolean> {
  try {
    const res = await fetchWithRetry(urlFrom, { maxAttempts: 2, timeoutMs: 10_000 })
    const present = res.body.includes(deadUrl) || res.body.includes(deadUrl.replace(/^https?:\/\//i, ""))
    if (!present) {
      log.info("dead link no longer present on live page, dropping", { urlFrom, deadUrl })
    }
    return present
  } catch (err) {
    log.warn("live link verification failed, dropping to be safe", { urlFrom, deadUrl, error: String(err) })
    return false
  }
}
