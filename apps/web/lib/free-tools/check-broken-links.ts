import { assertSafeUrl } from "@/lib/onboarding/fetch-site"
import { fetchPageLinks, type PageLink } from "./fetch-page-links"

const LINK_CHECK_TIMEOUT_MS = 6_000
const MAX_REDIRECTS = 5
const MAX_LINKS_CHECKED_PER_PAGE = 20
const CHECK_CONCURRENCY = 8

export type BrokenLink = {
  url: string
  anchorText: string
  status: number | null
  reason: string
}

export type PageBrokenLinksResult = {
  pageUrl: string
  totalLinksChecked: number
  brokenLinks: BrokenLink[]
}

/** Tiny concurrency-limited map — avoids pulling in p-limit for one call site. */
async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index] as T)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

/**
 * Follows redirects manually (validating each hop against SSRF rules, same
 * as the homepage fetcher) and classifies the final status. Only 404/410 and
 * hard network failures (dead domain, connection refused, DNS failure) count
 * as "broken" — anything else (403, 5xx, timeouts on a live server) is left
 * out to avoid flagging pages that are merely blocking bots.
 */
async function checkOne(link: PageLink): Promise<BrokenLink | null> {
  let currentUrl = link.href

  try {
    for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
      await assertSafeUrl(currentUrl)

      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), LINK_CHECK_TIMEOUT_MS)

      let response: Response
      try {
        response = await fetch(currentUrl, {
          method: "HEAD",
          redirect: "manual",
          signal: controller.signal,
          headers: {
            "user-agent":
              "Mozilla/5.0 (compatible; MentiohuntBot/0.1; +https://mentiohunt.com)",
          },
          cache: "no-store",
        })
      } finally {
        clearTimeout(timeout)
      }

      // Some servers reject HEAD outright — retry that hop with GET.
      if (response.status === 405 || response.status === 501) {
        const getController = new AbortController()
        const getTimeout = setTimeout(() => getController.abort(), LINK_CHECK_TIMEOUT_MS)
        try {
          response = await fetch(currentUrl, {
            method: "GET",
            redirect: "manual",
            signal: getController.signal,
            headers: {
              "user-agent":
                "Mozilla/5.0 (compatible; MentiohuntBot/0.1; +https://mentiohunt.com)",
            },
            cache: "no-store",
          })
        } finally {
          clearTimeout(getTimeout)
        }
      }

      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get("location")
        if (!location) return null
        currentUrl = new URL(location, currentUrl).toString()
        continue
      }

      if (response.status === 404 || response.status === 410) {
        return {
          url: link.href,
          anchorText: link.anchorText,
          status: response.status,
          reason: response.status === 410 ? "Page permanently removed (410)" : "Page not found (404)",
        }
      }

      return null
    }

    return {
      url: link.href,
      anchorText: link.anchorText,
      status: null,
      reason: "Too many redirects",
    }
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return null
    return {
      url: link.href,
      anchorText: link.anchorText,
      status: null,
      reason: "Site unreachable — likely expired or moved",
    }
  }
}

export async function findBrokenLinksOnPage(pageUrl: string): Promise<PageBrokenLinksResult> {
  const { links } = await fetchPageLinks(pageUrl)

  const externalLinks = links
    .filter((link) => !link.isInternal)
    .slice(0, MAX_LINKS_CHECKED_PER_PAGE)

  const checked = await mapWithConcurrency(externalLinks, CHECK_CONCURRENCY, checkOne)
  const brokenLinks = checked.filter((result): result is BrokenLink => result !== null)

  return {
    pageUrl,
    totalLinksChecked: externalLinks.length,
    brokenLinks,
  }
}
