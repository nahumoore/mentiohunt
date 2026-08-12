import type { SiteContext } from "../guest-post-sites/types.js"

export type { SiteContext }

export type FindBacklinkOpportunitiesInput = {
  url: string
  productName: string
  siteContext?: SiteContext
}

export type BacklinkOpportunity = {
  id: string
  domain: string
  name: string
  type: string
  score: number
  dr: number | null
  url: string
  reason: string
}

export type FindBacklinkOpportunitiesResult = {
  url: string
  productName: string
  niches: string[]
  queriesRun: number
  found: number
  scored: number
  highFit: number
  opportunities: BacklinkOpportunity[]
}

export const OPPORTUNITY_QUERY_TEMPLATES: {
  query: string
  footprintLabel: string
  type: string
}[] = [
  {
    query: '"{niche}" intitle:resources',
    footprintLabel: "resources page",
    type: "Resource Page",
  },
  {
    query: '"{niche}" "useful links"',
    footprintLabel: "useful links page",
    type: "Resource Page",
  },
  {
    query: '"{niche}" ("best tools" OR "top tools")',
    footprintLabel: "tool roundup",
    type: "Link Roundup",
  },
  {
    query: '"{niche}" ("recommended tools" OR "software list")',
    footprintLabel: "software list",
    type: "Link Roundup",
  },
  {
    query: '"{niche}" blog -"write for us"',
    footprintLabel: "niche blog",
    type: "Niche Blog",
  },
  {
    query: '"{niche}" "guest post"',
    footprintLabel: "guest post page",
    type: "Guest Post",
  },
]

export const DEFAULT_LIMITS = {
  maxNiches: 2,
  queryTemplatesPerNiche: 4,
  serpResultsPerQuery: "20" as const,
  maxCandidates: 40,
  maxOpportunities: 10,
  country: "US",
}
