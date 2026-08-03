/** A user-submitted prospect article, as read off the `backlink_prospects`
 * row after the web app inserts it. `article` fields are filled in once the
 * scraper has fetched the page (title/text may be a synthesized fallback if
 * the fetch failed — see prospect-submitted-url.ts). */
export type SubmittedUrlItem = {
  prospectId: string
  url: string
  domain: string
  article: {
    title: string
    text: string
  }
}

/** One of the user's own tracked pages, as a candidate for `pickTargetPageForUrl`. */
export type TargetPageCandidate = {
  id: string
  url: string
  title: string | null
  description: string | null
  page_type: string
  priority: number
  keywords: string[]
}

export type TargetPageChoice = {
  page: TargetPageCandidate
  score: number
  reason: string
  cost: number
}
