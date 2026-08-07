import { HttpStatusError, fetchWithRetry } from "../../../helpers/http.js"
import { SOFT_404_TITLE_PATTERNS, extractTitle } from "../../directories/head-check.js"

/**
 * `dead` / `redirect_dead` are deterministic (hard status code, or a redirect
 * that dropped the original path) and are the only statuses this strategy
 * acts on in v1. `soft_404` is detected and logged but never used to qualify
 * a prospect — the title heuristic in head-check.ts was tuned for directory
 * listing pages, not arbitrary web pages, and a false positive here means
 * telling a founder their link is broken when it isn't (see ticket 04's
 * open questions). `alive`/`error` mean nothing to report.
 */
export type DeadTargetCheck =
  | { status: "dead"; httpStatus: number; reason: string }
  | { status: "redirect_dead"; httpStatus: number; reason: string }
  | { status: "soft_404"; reason: string }
  | { status: "alive" }
  | { status: "error"; reason: string }

function pathDropped(originalUrl: string, finalUrl: string): boolean {
  try {
    const originalPath = new URL(originalUrl).pathname.replace(/\/+$/, "")
    const finalPath = new URL(finalUrl).pathname.replace(/\/+$/, "")
    if (!originalPath || originalPath === "") return false
    return finalPath !== originalPath && !finalPath.includes(originalPath)
  } catch {
    return false
  }
}

export async function checkDeadTarget(url: string): Promise<DeadTargetCheck> {
  try {
    const res = await fetchWithRetry(url, { maxAttempts: 2, timeoutMs: 10_000, rangeBytes: 8192 })

    if (pathDropped(url, res.url)) {
      return { status: "redirect_dead", httpStatus: res.status, reason: `redirected to ${res.url}` }
    }

    const title = extractTitle(res.body)
    if (title && SOFT_404_TITLE_PATTERNS.some((p) => p.test(title))) {
      return { status: "soft_404", reason: `soft-404 (title: "${title}")` }
    }

    return { status: "alive" }
  } catch (err) {
    if (err instanceof HttpStatusError && (err.status === 404 || err.status === 410)) {
      return { status: "dead", httpStatus: err.status, reason: "hard 404/410" }
    }
    return { status: "error", reason: String(err) }
  }
}
