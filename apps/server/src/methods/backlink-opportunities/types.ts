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
  returned: number
  lowConfidence: boolean
  opportunities: BacklinkOpportunity[]
}

// Only the first `queryTemplatesPerNiche` (4) templates are used per niche —
// order matters. Kept the two footprint templates that reliably return
// results; dropped "useful links"/"software list" (near-empty results or the
// aggregator hubs themselves) in favor of editorial surfaces that actually
// accept additions from small, newer products: niche blogs, alternatives
// roundups, newsletters, podcasts.
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
    query: '"{niche}" ("best tools" OR "top tools")',
    footprintLabel: "tool roundup",
    type: "Link Roundup",
  },
  {
    query: 'best "{niche}" blogs',
    footprintLabel: "niche blog roundup",
    type: "Niche Blog",
  },
  {
    query: '"{niche}" alternatives',
    footprintLabel: "alternatives roundup",
    type: "Link Roundup",
  },
  {
    query: '"{niche}" newsletter',
    footprintLabel: "newsletter",
    type: "Niche Blog",
  },
  {
    query: '"{niche}" podcast',
    footprintLabel: "podcast",
    type: "Niche Blog",
  },
]

export const DEFAULT_LIMITS = {
  maxNiches: 2,
  queryTemplatesPerNiche: 4,
  serpResultsPerQuery: "20" as const,
  maxCandidates: 40,
  maxOpportunities: 10,
  country: "US",
  scoreFloor: 50,
  drFloor: 15,
}
