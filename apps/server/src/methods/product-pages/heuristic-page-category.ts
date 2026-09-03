import { tokenize } from "./rank-candidate-urls.js"
import type {
  PageCategorization,
  PagePriority,
  PageToClassify,
  ProductPageType,
} from "./categorize-pages.js"

/**
 * No-LLM fallback categorization for when `categorizePages` exhausts its
 * retries. A preview must never stall because one classification batch is
 * slow, so pages that fail to categorize get a best-effort guess instead of
 * silently disappearing (see `categorize-pages.ts`'s fail-open reconcile).
 *
 * This is intentionally coarser than the LLM path — path-pattern matching
 * for pageType, token overlap for relevance — but it keeps target-page
 * selection and stage 2 discovery moving.
 */

const PAGE_TYPE_PATTERNS: [RegExp, ProductPageType][] = [
  [/\/(vs-|alternative|compare|comparison)/i, "comparison"],
  [/\/(case-stud|customer|success)/i, "case_study"],
  [/\/(tool|calculator|generator|free-)/i, "free_tool"],
  [/\/(blog|article|post|news)/i, "article"],
  [/\/(resource|guide|template|checklist)/i, "resource"],
]

function guessPageType(pathname: string): ProductPageType {
  for (const [pattern, type] of PAGE_TYPE_PATTERNS) {
    if (pattern.test(pathname)) return type
  }
  return "landing_page"
}

function priorityForType(pageType: ProductPageType): PagePriority {
  if (pageType === "article" || pageType === "resource" || pageType === "comparison") return "high"
  if (pageType === "case_study" || pageType === "free_tool") return "medium"
  return "low"
}

function pathnameOf(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

export function heuristicPageCategories(
  pages: PageToClassify[],
  targetKeywords: string[]
): PageCategorization[] {
  const keywordSets = targetKeywords.map((keyword, i) => ({
    keyword,
    tokens: new Set(tokenize(keyword)),
    weight: targetKeywords.length > 0 ? (targetKeywords.length - i) / targetKeywords.length : 1,
  }))
  const maxPossibleScore = keywordSets.reduce((sum, k) => sum + 3 * k.weight, 0)

  return pages.map((page) => {
    const pathname = pathnameOf(page.url)
    const pageType = guessPageType(pathname)
    const pageTokens = new Set([...tokenize(pathname), ...tokenize(page.title || "")])

    const matchedKeywords: string[] = []
    let score = 0
    for (const { keyword, tokens: kwTokens, weight } of keywordSets) {
      if (kwTokens.size === 0) continue
      const matched = [...kwTokens].filter((t) => pageTokens.has(t)).length
      if (matched === 0) continue
      if (matched === kwTokens.size) score += 3 * weight
      else if (matched >= kwTokens.size / 2) score += 1.5 * weight
      else continue
      matchedKeywords.push(keyword)
    }

    const relevanceScore =
      targetKeywords.length === 0 || maxPossibleScore === 0
        ? 0
        : Math.round(Math.min(100, (score / maxPossibleScore) * 100))

    return {
      url: page.url,
      pageType,
      keywords: matchedKeywords.length > 0 ? matchedKeywords : tokenize(page.title || "").slice(0, 5),
      priority: priorityForType(pageType),
      relevanceScore,
      matchedKeywords,
      reason: "heuristic fallback",
    }
  })
}
