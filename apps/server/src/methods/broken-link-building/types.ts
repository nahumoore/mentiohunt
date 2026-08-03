import type { SiteContext } from "../guest-post-sites/types.js"

export type { SiteContext }

export type FindBrokenLinkCandidatesInput = {
  url: string
  productName: string
  siteContext?: SiteContext
}

export type BrokenLinkCandidate = {
  id: string
  domain: string
  url: string
  title: string
  snippet: string
  matchedQuery: string
  matchedFootprint: string
}

export type FindBrokenLinkCandidatesResult = {
  url: string
  productName: string
  niches: string[]
  queriesRun: number
  candidates: BrokenLinkCandidate[]
}

// {niche} gets substituted with each derived niche phrase. footprintLabel is
// shown in the UI so users know why a page surfaced ("resources page").
// These target curated link/resource pages — the kind that accumulate dead
// outbound links over time and are prime broken-link-building targets.
export const BROKEN_LINK_QUERY_TEMPLATES: { query: string; footprintLabel: string }[] = [
  { query: '"{niche}" "resources" intitle:resources', footprintLabel: "resources page" },
  { query: '"{niche}" "useful links"', footprintLabel: "useful links page" },
  { query: '"{niche}" intitle:"links"', footprintLabel: "links page" },
  { query: '"{niche}" "helpful resources"', footprintLabel: "helpful resources page" },
]

export const DEFAULT_LIMITS = {
  maxNiches: 2,
  queryTemplatesPerNiche: 4,
  serpResultsPerQuery: "20" as const,
  maxCandidates: 20,
  country: "US",
}
