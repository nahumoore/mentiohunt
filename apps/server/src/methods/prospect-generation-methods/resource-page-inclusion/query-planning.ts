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
        const aLast = lastRunByPageId.get(a.id) ?? ""
        const bLast = lastRunByPageId.get(b.id) ?? ""
        if (aLast !== bLast) return aLast < bLast ? -1 : 1
        return b.priority - a.priority
      })

  return sorted.slice(0, maxPages)
}

export function buildQueryPlan(
  pages: TargetPageForInclusion[],
  queryTemplates: string[],
  maxQueriesPerPage: number,
  lastRunByQueryKey: Map<string, string>
): QueryPlanItem[] {
  const plan: QueryPlanItem[] = []
  for (const page of pages) {
    const keywords = (page.keywords.length > 0 ? page.keywords : fallbackKeywords(page))
      .map(cleanKeyword)
      .filter(Boolean)
      .slice(0, 8)
    const pageQueries = new Set<string>()

    for (const keyword of keywords) {
      for (const template of queryTemplates) {
        pageQueries.add(template.replaceAll("{keyword}", keyword))
      }
    }

    const selectedQueries = [...pageQueries]
      .sort((a, b) => {
        const aLast = lastRunByQueryKey.get(queryKey(page.id, a)) ?? ""
        const bLast = lastRunByQueryKey.get(queryKey(page.id, b)) ?? ""
        if (aLast !== bLast) return aLast < bLast ? -1 : 1
        return a.localeCompare(b)
      })
      .slice(0, maxQueriesPerPage)

    for (const query of selectedQueries) plan.push({ query, targetPage: page })
  }
  return plan
}
