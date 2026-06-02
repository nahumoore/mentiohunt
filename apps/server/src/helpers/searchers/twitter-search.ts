import { runApifyActor } from "../actors/run-apify-actor.js"
import {
  APIDOJO_TWEET_SCRAPER,
  type RawTweet,
} from "../actors/tweet-scraper.js"
import { createLogger } from "../logger.js"

const log = createLogger("twitter-search")
const APIDOJO_TWEET_SCRAPER_COST_PER_TWEET_USD = 0.0004

export interface TwitterPost {
  id: string
  text: string
  author_handle: string
  author_name: string | null
  url: string
  created_at: string
}

export interface TwitterSearchResult {
  posts: TwitterPost[]
  costUsd: number
}

interface TwitterSearchOptions {
  maxItems?: number
}

function mapRawTweet(raw: RawTweet): TwitterPost | null {
  const id = raw.id
  const text = raw.fullText ?? raw.text
  const url = raw.url
  const createdAt = raw.createdAt
  const authorHandle = raw.author?.userName

  if (!id || !text || !url || !createdAt || !authorHandle) return null

  const parsedDate = new Date(createdAt)
  const isoDate = isNaN(parsedDate.getTime())
    ? createdAt
    : parsedDate.toISOString()

  return {
    id,
    text,
    author_handle: authorHandle,
    author_name: raw.author?.name ?? null,
    url,
    created_at: isoDate,
  }
}

export async function searchTwitter(
  queries: readonly string[],
  options: TwitterSearchOptions = {}
): Promise<TwitterSearchResult> {
  const { maxItems = 200 } = options

  log.info("running twitter search", { queries: queries.length, maxItems })

  try {
    const items = await runApifyActor<RawTweet[]>(
      APIDOJO_TWEET_SCRAPER,
      {
        searchTerms: [...queries],
        maxItems,
        sort: "Latest",
        tweetLanguage: "en",
      },
      300
    )

    if (!Array.isArray(items)) {
      log.warn("unexpected apify response shape", { type: typeof items })
      return { posts: [], costUsd: 0 }
    }

    const posts: TwitterPost[] = []
    for (const raw of items) {
      const mapped = mapRawTweet(raw)
      if (mapped) posts.push(mapped)
    }

    const costUsd = items.length * APIDOJO_TWEET_SCRAPER_COST_PER_TWEET_USD

    log.info("twitter search complete", {
      raw: items.length,
      mapped: posts.length,
      apify_cost_usd: costUsd.toFixed(4),
    })
    return { posts, costUsd }
  } catch (err) {
    log.warn("twitter search failed", { error: String(err) })
    return { posts: [], costUsd: 0 }
  }
}
