// Shared between route.ts (single submit) and bulk/route.ts (CSV/paste
// import) — both need identical URL normalization and own-domain checks so a
// link submitted one-at-a-time and one submitted via CSV dedupe the same way.

export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
  const parsed = new URL(withScheme)
  parsed.hash = ""
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1)
  }
  return parsed.toString()
}

export function hostnameOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
}

export function safeHostnameOf(url: string): string | null {
  try {
    return hostnameOf(url)
  } catch {
    return null
  }
}

/**
 * Runs `fn` over `items` with at most `concurrency` in flight at once. Each
 * `assertSafeUrl` call does a DNS lookup, so bulk import (up to 100 rows)
 * can't run them all in parallel without risking the route's timeout — and
 * doesn't need a dependency for something this small.
 */
export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor++
      results[index] = await fn(items[index]!, index)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}
