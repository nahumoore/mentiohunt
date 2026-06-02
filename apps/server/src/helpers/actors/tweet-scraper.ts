/**
 * Tweet Scraper by apidojo
 * https://apify.com/apidojo/tweet-scraper
 *
 * Input: TweetScraperInput
 * NOTE: do NOT pass start/end date params — same-day ranges return noResults.
 *       Use sort:"Latest" + maxItems to control recency instead.
 * Output per item: RawTweet (verified 2026-05-25)
 *
 * Pricing: $0.0004 / tweet (PAY_PER_EVENT, as of 2026-02-16).
 * At 200 tweets/run × 2 runs/day = ~$0.16/day.
 */
export const APIDOJO_TWEET_SCRAPER = "apidojo~tweet-scraper"

export type TweetScraperInput = {
  searchTerms: string[]
  maxItems: number
  sort: "Latest" | "Top"
  tweetLanguage?: string
}

// Confirmed output shape from apidojo/tweet-scraper (verified live 2026-05-25).
// createdAt is Twitter date format: "Mon May 25 15:02:04 +0000 2026" — parse via new Date().
export interface RawTweet {
  id?: string
  text?: string
  fullText?: string
  url?: string
  twitterUrl?: string
  createdAt?: string
  author?: {
    userName?: string
    name?: string
    id?: string
    profilePicture?: string
  }
  likeCount?: number
  replyCount?: number
  retweetCount?: number
  viewCount?: number
  bookmarkCount?: number
  isReply?: boolean
  isRetweet?: boolean
  isQuote?: boolean
  lang?: string
}
