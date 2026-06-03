import { createLogger } from "../../helpers/logger.js"
import { searchBluesky, warmBlueskyToken } from "../../helpers/searchers/bluesky-search.js"
import { searchTwitter } from "../../helpers/searchers/twitter-search.js"

const log = createLogger("gather-media-posts")

export interface RawPost {
  id: string
  platform: "twitter" | "bluesky"
  text: string
  author_handle: string
  author_name: string | null
  url: string
  created_at: string
}

interface GatherChunk {
  posts: RawPost[]
  apifyCostUsd: number
}

export async function gatherMediaPosts(
  queries: string[]
): Promise<{ posts: RawPost[]; apifyCostUsd: number }> {
  if (queries.length === 0) return { posts: [], apifyCostUsd: 0 }

  // Bluesky: 24h window. Twitter: no date filter (Apify returns latest with sort:"Latest").
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const until = new Date().toISOString()

  log.info("searching platforms", { queries: queries.length, bluesky_window: "24h" })

  await warmBlueskyToken()

  const tasks: Promise<GatherChunk>[] = []

  for (const query of queries) {
    tasks.push(
      searchBluesky(query, 50, { sort: "latest", since, until })
        .then((posts): GatherChunk => {
          log.info("bluesky query done", { query, posts: posts.length })
          return {
            posts: posts.map((p): RawPost => ({
              id: `bluesky:${p.id}`,
              platform: "bluesky",
              text: p.text,
              author_handle: p.author_handle,
              author_name: p.author_display_name,
              url: p.url,
              created_at: p.created_at,
            })),
            apifyCostUsd: 0,
          }
        })
        .catch((err): GatherChunk => {
          log.warn("bluesky query failed", { query, error: String(err) })
          return { posts: [], apifyCostUsd: 0 }
        })
    )
  }

  tasks.push(
    searchTwitter(queries, { maxItems: 200 })
      .then(({ posts, costUsd }): GatherChunk => {
        log.info("twitter search done", { posts: posts.length, cost_usd: costUsd.toFixed(4) })
        return {
          posts: posts.map((p): RawPost => ({
            id: `twitter:${p.id}`,
            platform: "twitter",
            text: p.text,
            author_handle: p.author_handle,
            author_name: p.author_name,
            url: p.url,
            created_at: p.created_at,
          })),
          apifyCostUsd: costUsd,
        }
      })
      .catch((err): GatherChunk => {
        log.warn("twitter search failed", { error: String(err) })
        return { posts: [], apifyCostUsd: 0 }
      })
  )

  const results = await Promise.all(tasks)
  const apifyCostUsd = results.reduce((sum, r) => sum + r.apifyCostUsd, 0)

  const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  const seen = new Set<string>()
  const deduped: RawPost[] = []
  for (const result of results) {
    for (const post of result.posts) {
      if (seen.has(post.url)) continue
      const postDate = new Date(post.created_at)
      if (!isNaN(postDate.getTime()) && postDate < cutoff) continue
      seen.add(post.url)
      deduped.push(post)
    }
  }

  log.info("gathered posts", {
    bluesky: deduped.filter((p) => p.platform === "bluesky").length,
    twitter: deduped.filter((p) => p.platform === "twitter").length,
    total: deduped.length,
    apify_cost_usd: apifyCostUsd.toFixed(4),
  })

  return { posts: deduped, apifyCostUsd }
}
