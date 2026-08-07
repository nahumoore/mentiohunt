export type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  competitors: string[]
}

/** One of the product's own crawled pages, eligible to be pitched as a dead-link replacement. */
export type ReplacementPageCandidate = {
  id: string
  url: string
  title: string | null
  description: string | null
  page_type: string
  priority: number
  keywords: string[]
}

// A plain HTTP status (hard 404/410) is the clean case. "redirected" covers
// a redirect that dropped the original path — the landing page itself may
// well return 200, so surfacing that numeric status would read as "this
// link works fine", the opposite of what's true. "soft_404" is reserved for
// future use; v1 never acts on it (see check-dead-target.ts).
export type DeadUrlStatus = number | "soft_404" | "redirected"

/** A linking page (url_from) whose target (url_to) has been confirmed dead. */
export type DeadLinkCandidate = {
  urlFrom: string
  competitorDomain: string
  deadUrl: string
  deadUrlStatus: DeadUrlStatus
  anchor: string
  domainRating: number
  title: string
  textPre: string
  textPost: string
}

export type MatchedDeadLinkCandidate = DeadLinkCandidate & {
  targetPageId: string
  targetUrl: string
  targetTitle: string
  matchReason: string
}
