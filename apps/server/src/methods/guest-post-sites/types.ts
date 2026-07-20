export type SiteContext = {
  title: string | null
  metaDescription: string | null
  h1: string[]
  paragraphs: string[]
}

export type FindGuestPostSitesInput = {
  url: string
  productName: string
  siteContext?: SiteContext
}

export type GuestPostSiteResult = {
  domain: string
  name: string
  url: string
  score: number
  reason: string
  matchedQuery: string
  matchedFootprint: string
}

export type FindGuestPostSitesResult = {
  url: string
  productName: string
  niches: string[]
  queriesRun: number
  found: number
  scored: number
  sites: GuestPostSiteResult[]
}

// {niche} gets substituted with each derived niche phrase. footprintLabel is
// shown in the UI so users know why a site surfaced ("Found via: write for us").
export const GUEST_POST_QUERY_TEMPLATES: { query: string; footprintLabel: string }[] = [
  { query: '"{niche}" "write for us"', footprintLabel: "write for us" },
  { query: '"{niche}" "guest post"', footprintLabel: "guest post" },
  { query: '"{niche}" "submit a guest post"', footprintLabel: "submit a guest post" },
  { query: '"{niche}" "become a contributor"', footprintLabel: "become a contributor" },
  { query: '"{niche}" intitle:"write for us"', footprintLabel: "write for us" },
  { query: '"{niche}" "guest post guidelines"', footprintLabel: "guest post guidelines" },
]

export const DEFAULT_LIMITS = {
  maxNiches: 2,
  queryTemplatesPerNiche: 3,
  serpResultsPerQuery: "20" as const,
  maxCandidates: 40,
  maxSites: 10,
  country: "US",
}
