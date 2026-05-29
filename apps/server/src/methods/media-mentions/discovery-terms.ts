// Core journalist/PR request hashtags — always searched, no LLM needed.
// Volume order: #journorequest >> #journalistrequest > #PRrequest > #journocall > rest.
export const CORE_JOURNALIST_HASHTAGS = [
  "#journorequest",
  "#journalistrequest",
  "#PRrequest",
  "#journocall",
  "#HARO",
  "#mediaquery",
  "#expertrequest",
] as const

// Primary hashtag to combine with product topic terms from LLM.
export const PRIMARY_JOURNALIST_HASHTAG = "#journorequest"

// Fallback: full list used when LLM topic extraction fails entirely.
export const MEDIA_REQUEST_QUERIES = CORE_JOURNALIST_HASHTAGS

export type CoreJournalistHashtag = (typeof CORE_JOURNALIST_HASHTAGS)[number]
