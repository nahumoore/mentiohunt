import { HttpStatusError, fetchWithRetry } from "../../helpers/http.js"
import { type CheckResult } from "./serp-check.js"

type Directory = {
  domain: string
  submit_url: string
  slug_pattern: string | null
}

const SOFT_404_TITLE_PATTERNS = [
  /\b404\b/,
  /not found/i,
  /page not found/i,
  /doesn'?t exist/i,
  /does not exist/i,
  /no longer available/i,
  /couldn'?t find/i,
  /oops/i,
]

function extractTitle(body: string): string {
  const m = body.match(/<title[^>]*>([^<]*)<\/title>/i)
  return m?.[1]?.trim() ?? ""
}

type TitleSignal = "listed" | "gap" | "unknown"

function checkTitle(body: string, slug: string): TitleSignal {
  const title = extractTitle(body)
  if (!title) return "unknown"
  if (SOFT_404_TITLE_PATTERNS.some((p) => p.test(title))) return "gap"
  if (!title.toLowerCase().includes(slug.toLowerCase())) return "gap"
  return "listed"
}

export async function headCheck(directory: Directory, slug: string): Promise<CheckResult> {
  if (!directory.slug_pattern) {
    return { status: "error", url: directory.submit_url, reason: "no slug_pattern configured" }
  }

  const url = directory.slug_pattern.replace("{slug}", encodeURIComponent(slug))

  try {
    const res = await fetchWithRetry(url, { maxAttempts: 2, timeoutMs: 10_000, rangeBytes: 8192 })
    // Redirect to a URL without the slug = soft 404 (e.g. redirect to homepage)
    if (!res.url.toLowerCase().includes(slug.toLowerCase())) {
      return { status: "gap", url, reason: `redirected to ${res.url}` }
    }
    // Inspect title to detect soft-404 vs real listing vs unresolvable SPA
    const titleSignal = checkTitle(res.body, slug)
    if (titleSignal === "gap") {
      return { status: "gap", url, reason: `soft-404 (title: "${extractTitle(res.body)}")` }
    }
    if (titleSignal === "unknown") {
      // Empty title = SPA with client-side rendering; head_check can't determine status
      return { status: "error", url, reason: "empty title (SPA): deferred to SERP" }
    }
    return { status: "listed", url: res.url }
  } catch (err) {
    if (err instanceof HttpStatusError && [404, 410].includes(err.status)) {
      return { status: "gap", url }
    }
    return { status: "error", url, reason: String(err) }
  }
}
