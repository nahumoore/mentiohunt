import dns from "node:dns/promises"

const DNS_TIMEOUT_MS = 2000

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error("DNS lookup timed out")), ms)
    }),
  ])
}

async function resolvesToSomething(hostname: string): Promise<boolean> {
  const lookups: Array<() => Promise<unknown[]>> = [
    () => dns.resolve4(hostname),
    () => dns.resolve6(hostname),
    () => dns.resolveMx(hostname),
    () => dns.resolveNs(hostname),
  ]

  const results = await Promise.allSettled(
    lookups.map((lookup) => withTimeout(lookup(), DNS_TIMEOUT_MS))
  )

  return results.some((result) => result.status === "fulfilled" && result.value.length > 0)
}

export function extractHostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return url
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

export type DomainValidationResult = {
  valid: string[]
  invalid: string[]
}

/**
 * A domain that resolves to no DNS records at all (A/AAAA/MX/NS) is either a
 * fake TLD or a dead domain either way, not a usable competitor.
 */
export async function validateDomains(urls: string[]): Promise<DomainValidationResult> {
  const results = await Promise.all(
    urls.map(async (url) => {
      const hostname = extractHostname(url)
      const ok = hostname.length > 0 && (await resolvesToSomething(hostname))
      return { url, ok }
    })
  )

  return {
    valid: results.filter((r) => r.ok).map((r) => r.url),
    invalid: results.filter((r) => !r.ok).map((r) => r.url),
  }
}
