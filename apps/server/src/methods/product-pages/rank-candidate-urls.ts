const STOPWORDS = new Set([
  "a", "an", "the", "of", "for", "to", "and", "or", "in", "on", "with", "how", "what", "why",
])

// Exported so `heuristic-page-category.ts` can score title/description text
// with the same token rules used here for URL slugs, rather than
// reimplementing tokenization.
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length > 1 && !STOPWORDS.has(t))
}

function pathTokens(pathname: string): string[] {
  return pathname
    .split("/")
    .flatMap((segment) => segment.split(/[-_]/))
    .filter((segment) => segment.length > 0 && !/^\d+$/.test(segment))
    .flatMap((segment) => tokenize(segment))
}

/**
 * Cheap, no-LLM pre-rank of sitemap URLs against a keyword set, using slug
 * token overlap only. Shared by two callers: `rankCandidateUrls` uses it to
 * keep the crawl budget bounded before any scraping happens, and the preview
 * fail-open path (`heuristic-page-category.ts`) reuses the same scoring to
 * guess a page's relevance when LLM categorization has exhausted its
 * retries.
 *
 * `keywords` arrives in priority order (index 0 = priority 1, highest), so
 * each keyword's contribution is weighted by its rank — a priority-1 slug
 * match outranks a priority-5 match on an otherwise identical URL.
 */
export function rankCandidateUrlsScored(
  urls: string[],
  keywords: string[]
): { url: string; score: number; isHomepage: boolean }[] {
  const keywordTokenSets = keywords.map((k, i) => ({
    phrase: k.toLowerCase().replace(/\s+/g, "-"),
    tokens: new Set(tokenize(k)),
    weight: keywords.length > 0 ? (keywords.length - i) / keywords.length : 1,
  }))

  const scored = urls.map((url, index) => {
    let pathname: string
    try {
      pathname = new URL(url).pathname
    } catch {
      pathname = url
    }

    const tokens = pathTokens(pathname)
    const tokenSet = new Set(tokens)
    const lowerPath = pathname.toLowerCase()

    let score = 0
    for (const { phrase, tokens: kwTokens, weight } of keywordTokenSets) {
      if (kwTokens.size === 0) continue
      if (lowerPath.includes(phrase)) {
        score += 3 * weight
        continue
      }
      const matched = [...kwTokens].filter((t) => tokenSet.has(t)).length
      if (matched === kwTokens.size) score += 2 * weight
      else if (matched >= kwTokens.size / 2) score += 1 * weight
    }

    // Shallow-path tie-break bonus, and homepage always survives at score 0.
    const depthBonus = Math.max(0, 3 - (pathname.split("/").filter(Boolean).length)) * 0.1
    const isHomepage = pathname === "/" || pathname === ""

    return { url, score: score + depthBonus, isHomepage, index }
  })

  scored.sort((a, b) => b.score - a.score || a.index - b.index)

  return scored.map(({ url, score, isHomepage }) => ({ url, score, isHomepage }))
}

/**
 * Slices `rankCandidateUrlsScored` down to `limit`, always keeping the
 * homepage as a candidate even at score 0 since it's always a legitimate
 * fallback target.
 */
export function rankCandidateUrls(urls: string[], keywords: string[], limit: number): string[] {
  const scored = rankCandidateUrlsScored(urls, keywords)

  const top = scored.slice(0, limit)
  if (!top.some((s) => s.isHomepage)) {
    const homepage = scored.find((s) => s.isHomepage)
    if (homepage) {
      top.pop()
      top.push(homepage)
    }
  }

  return top.map((s) => s.url)
}
