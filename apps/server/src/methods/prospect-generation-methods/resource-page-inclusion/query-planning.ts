import { cleanKeyword, fallbackKeywords, queryKey } from "./helpers.js"
import type { TargetPageForInclusion } from "./score-resource-page-inclusion.js"
import type { QueryPlanItem } from "./types.js"

export function selectPagesForRun(
  pages: TargetPageForInclusion[],
  maxPages: number,
  lastRunByPageId: Map<string, string>,
  explicitPageIds: boolean
): TargetPageForInclusion[] {
  const sorted = explicitPageIds
    ? pages
    : [...pages].sort((a, b) => {
        // Day-bucketed so priority — not a few seconds of timestamp jitter —
        // decides ordering among pages last run on the same day. Rotation
        // across days is still preserved: least-recently-run day wins first.
        const aLast = (lastRunByPageId.get(a.id) ?? "").slice(0, 10)
        const bLast = (lastRunByPageId.get(b.id) ?? "").slice(0, 10)
        if (aLast !== bLast) return aLast < bLast ? -1 : 1
        // Priority is user-ranked, 1 = highest.
        return a.priority - b.priority
      })

  return sorted.slice(0, maxPages)
}

/**
 * Keyword source per page, most specific/confirmed first: a page's own
 * matched target keywords (known to genuinely serve the customer's confirmed
 * intent), then the product's confirmed target keywords, then the page's
 * LLM-extracted topics, then a title-derived fallback.
 */
function keywordsForPage(page: TargetPageForInclusion, productTargetKeywords: string[]): string[] {
  if (page.matched_keywords.length > 0) return page.matched_keywords
  if (productTargetKeywords.length > 0) return productTargetKeywords
  if (page.keywords.length > 0) return page.keywords
  return fallbackKeywords(page)
}

export function buildQueryPlan(
  pages: TargetPageForInclusion[],
  queryTemplates: string[],
  maxQueriesPerPage: number,
  lastRunByQueryKey: Map<string, string>,
  productTargetKeywords: string[] = []
): QueryPlanItem[] {
  const plan: QueryPlanItem[] = []
  // Multiple pages can fall back to the same keyword source (most commonly
  // productTargetKeywords, identical for every page with no matched_keywords
  // of its own) — without this, every page would build the same query, and
  // the SERP/scrape/LLM-scoring cost downstream (discoverResourcePageInclusions)
  // would multiply per page for what bestByDomain collapses back into one
  // prospect anyway. Claimed queries are tracked globally so each page's plan
  // contributes distinct queries.
  const claimedQueries = new Set<string>()

  for (const page of pages) {
    const keywords = keywordsForPage(page, productTargetKeywords)
      .map(cleanKeyword)
      .filter(Boolean)
      .slice(0, 8)

    // Reuses rank-candidate-urls.ts's priority weight formula — keyword i's
    // weight decays with its rank in the (already priority-ordered) list.
    const weightByKeyword = new Map(
      keywords.map((k, i) => [k, keywords.length > 0 ? (keywords.length - i) / keywords.length : 1])
    )

    const weightByQuery = new Map<string, number>()
    for (const keyword of keywords) {
      const weight = weightByKeyword.get(keyword) ?? 1
      for (const template of queryTemplates) {
        const query = template.replaceAll("{keyword}", keyword)
        if (claimedQueries.has(query)) continue
        const existing = weightByQuery.get(query)
        if (existing === undefined || weight > existing) weightByQuery.set(query, weight)
      }
    }

    const selectedQueries = [...weightByQuery.keys()]
      .sort((a, b) => {
        const aLast = lastRunByQueryKey.get(queryKey(page.id, a)) ?? ""
        const bLast = lastRunByQueryKey.get(queryKey(page.id, b)) ?? ""
        if (aLast !== bLast) return aLast < bLast ? -1 : 1
        return (weightByQuery.get(b) ?? 1) - (weightByQuery.get(a) ?? 1)
      })
      .slice(0, maxQueriesPerPage)

    for (const query of selectedQueries) {
      claimedQueries.add(query)
      plan.push({ query, targetPage: page })
    }
  }
  return plan
}
