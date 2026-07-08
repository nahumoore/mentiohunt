import type { TargetPageForInclusion } from "./score-resource-page-inclusion.js"

export type SerpLimit = "10" | "20" | "30" | "40" | "50" | "100" | "all"

export type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
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
  minPriority?: number
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

export const DEFAULT_PAGE_TYPES = ["article", "resource", "free_tool", "comparison", "case_study"]

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
  minPriority: 3,
  country: "US",
  scoringThreshold: 3,
}
