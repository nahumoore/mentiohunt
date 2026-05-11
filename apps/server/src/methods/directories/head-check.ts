import { HttpStatusError, fetchWithRetry } from "../../helpers/http.js"
import { type CheckResult } from "./serp-check.js"

type Directory = {
  domain: string
  submit_url: string
  slug_pattern: string | null
}

export async function headCheck(directory: Directory, slug: string): Promise<CheckResult> {
  if (!directory.slug_pattern) {
    return { status: "error", url: directory.submit_url, reason: "no slug_pattern configured" }
  }

  const url = directory.slug_pattern.replace("{slug}", encodeURIComponent(slug))

  try {
    await fetchWithRetry(url, { maxAttempts: 2, timeoutMs: 10_000 })
    return { status: "listed", url }
  } catch (err) {
    if (err instanceof HttpStatusError && [404, 410].includes(err.status)) {
      return { status: "gap", url }
    }
    return { status: "error", url, reason: String(err) }
  }
}
