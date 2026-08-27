import type { TargetPageForInclusion } from "./score-resource-page-inclusion.js"

export type SerpLimit = "10" | "20" | "30" | "40" | "50" | "100" | "all"

export type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  target_keywords?: string[] | null
}

export type ResourcePageInclusionOptions = {
  pageIds?: string[]
  pageTypes?: string[]
  queryTemplates?: string[]
  maxPages?: number
  maxQueriesPerPage?: number
  maxCandidates?: number
  maxProspects?: number
  serpResultsPerQuery?: SerpLimit
  /** Priority is user-ranked, 1 = highest. Pages with priority > maxPriority are excluded. */
  maxPriority?: number
  country?: string
  scoringThreshold?: number
  dryRun?: boolean
}

export type QueryPlanItem = {
  query: string
  targetPage: TargetPageForInclusion
}

export type RunHistory = {
  runsConsidered: number
  lastRunByPageId: Map<string, string>
  lastRunByQueryKey: Map<string, string>
}

export const DEFAULT_QUERY_TEMPLATES = [
  '"{keyword}" resources',
  '"{keyword}" tools',
  '"{keyword}" templates',
  '"{keyword}" checklist',
  'intitle:resources "{keyword}"',
  'intitle:tools "{keyword}"',
]

export const DEFAULT_LIMITS = {
  maxPages: 3,
  maxQueriesPerPage: 2,
  maxCandidates: 20,
  maxProspects: 10,
  serpResultsPerQuery: "20" as const,
  // With a hard 5-page tracked cap and user-chosen priority, this is a no-op
  // by default — every target page qualifies. Kept as an explicit override
  // point for callers that want to focus only on the top-ranked pages.
  maxPriority: 5,
  country: "US",
  scoringThreshold: 3,
}
