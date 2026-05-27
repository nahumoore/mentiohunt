import {
  searchReddit,
  type RedditPost,
} from "../../helpers/searchers/reddit-search.js"
import {
  searchBluesky,
  type BlueskyPost,
} from "../../helpers/searchers/bluesky-search.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("reply-queue-gather")

export interface GatheredPost {
  platform: "reddit" | "bluesky"
  post_id: string
  title: string | null
  body: string
  display_body?: string
  url: string
  community: string | null
  author: string | null
  engagement: number
  comment_count: number
  post_created_at: string | null
  is_crosspost: boolean
  has_text_body: boolean
}

export interface ConfigCommunity {
  platform: string
  community: string
}

export async function gatherPosts(options: {
  platforms: string[]
  communities: ConfigCommunity[]
  keywords: string[]
  dateWindowDays: number
}): Promise<GatheredPost[]> {
  const { platforms, communities, keywords, dateWindowDays } = options

  const results: GatheredPost[] = []
  const seen = new Set<string>()

  const timeOption = dateWindowDays <= 1 ? ("day" as const) : ("week" as const)
  const now = new Date()
  const since = new Date(now.getTime() - dateWindowDays * 24 * 60 * 60 * 1000)
  const sinceISO = since.toISOString()
  const untilISO = now.toISOString()

  const tasks: Promise<void>[] = []

  function addPost(post: GatheredPost) {
    const key = `${post.platform}:${post.post_id}`
    if (seen.has(key)) return
    seen.add(key)
    results.push(post)
  }

  const redditCommunities = communities
    .filter((c) => c.platform === "reddit")
    .map((c) => c.community)

  if (platforms.includes("reddit")) {
    for (const keyword of keywords) {
      tasks.push(
        searchReddit(keyword, timeOption, 25)
          .then((posts) => {
            posts.forEach((p) => addPost(mapRedditPost(p)))
            log.info("reddit global search", { keyword, found: posts.length })
          })
          .catch((err) =>
            log.warn("reddit global search failed", { keyword, error: String(err) })
          )
      )

      for (const community of redditCommunities) {
        const subreddit = community.replace(/^r\//, "")
        tasks.push(
          searchReddit(keyword, timeOption, 25, { community: subreddit })
            .then((posts) => {
              posts.forEach((p) => addPost(mapRedditPost(p)))
              log.info("reddit community search", { keyword, community, found: posts.length })
            })
            .catch((err) =>
              log.warn("reddit community search failed", {
                keyword,
                community,
                error: String(err),
              })
            )
        )
      }
    }
  }

  if (platforms.includes("bluesky")) {
    for (const keyword of keywords) {
      tasks.push(
        searchBluesky(keyword, 35, { sort: "top", since: sinceISO, until: untilISO })
          .then((posts) => {
            posts.forEach((p) => addPost(mapBlueskyPost(p)))
            log.info("bluesky search", { keyword, found: posts.length })
          })
          .catch((err) =>
            log.warn("bluesky search failed", { keyword, error: String(err) })
          )
      )
    }
  }

  await Promise.all(tasks)

  const byPlatform = results.reduce<Record<string, number>>((acc, p) => {
    acc[p.platform] = (acc[p.platform] ?? 0) + 1
    return acc
  }, {})

  log.info("gathered posts", {
    total: results.length,
    byPlatform,
    posts: results.map((p) => ({
      platform: p.platform,
      community: p.community,
      title: p.title ?? truncateBody(p.body, 12),
      engagement: p.engagement,
    })),
  })

  return results
}

function truncateBody(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ") + "…"
}

const EMPTY_SELFTEXT = new Set(["", "[deleted]", "[removed]"])

function mapRedditPost(p: RedditPost): GatheredPost {
  const selftext = p.selftext?.trim() ?? ""
  const hasTextBody = !EMPTY_SELFTEXT.has(selftext) && selftext.length >= 20
  return {
    platform: "reddit",
    post_id: p.id,
    title: p.title || null,
    body: (hasTextBody ? selftext : null) ?? p.title ?? "",
    url: `https://www.reddit.com${p.permalink}`,
    community: p.subreddit ? `r/${p.subreddit}` : null,
    author: p.author ?? null,
    engagement: p.score,
    comment_count: p.num_comments ?? 0,
    post_created_at: p.created_utc
      ? new Date(p.created_utc * 1000).toISOString()
      : null,
    is_crosspost: (p.crosspost_parent_list?.length ?? 0) > 0,
    has_text_body: hasTextBody,
  }
}

function mapBlueskyPost(p: BlueskyPost): GatheredPost {
  const body = p.parent_post
    ? `[replying to: ${truncateBody(p.parent_post.text, 60)}]\n\n${p.text}`
    : p.text

  return {
    platform: "bluesky",
    post_id: p.id,
    title: null,
    body,
    display_body: p.text,
    url: p.url,
    community: null,
    author: p.author_handle,
    engagement: p.like_count,
    comment_count: p.reply_count,
    post_created_at: p.created_at,
    is_crosspost: false,
    has_text_body: body.trim().length >= 20,
  }
}
