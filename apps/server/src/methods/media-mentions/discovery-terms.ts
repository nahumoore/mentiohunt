// Hashtags and phrases to search across X and Bluesky for journalist/PR requests.
// Most volume: #journorequest >> #PRrequest > #journocall > phrase queries.
// Edit this list to tune recall; no DB migration required.
export const MEDIA_REQUEST_QUERIES = [
  "#journorequest",
  "#journorequests",
  "#PRrequest",
  "#PRrequests",
  "#journocall",
  "#HARO",
  "#helpareporter",
  "#sourcerequest",
  '"looking for sources"',
  '"seeking expert"',
] as const

export type MediaRequestQuery = (typeof MEDIA_REQUEST_QUERIES)[number]
