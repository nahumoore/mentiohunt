import { createLogger } from "../logger.js"

const log = createLogger("reddit-search")

export type TimeOption = "hour" | "day" | "week" | "month" | "year" | "all"

export interface RedditComment {
  id: string
  body: string
  score: number
}

export interface RedditPost {
  id: string
  title: string
  selftext: string
  score: number
  subreddit: string
  permalink: string
  created_utc?: number
  author?: string
  num_comments?: number
  comments?: RedditComment[]
}

interface RedditListingChild {
  kind: string
  data: RedditPost
}

interface RedditListing {
  kind: string
  data: {
    children: RedditListingChild[]
  }
}

const USER_AGENT = "Mentiohunt/1.0"

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// ─── OAuth token cache ─────────────────────────────────────────────────────

interface TokenCache {
  accessToken: string
  expiresAt: number
}

let tokenCache: TokenCache | null = null

export async function getRedditAccessToken(): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessToken
  }

  const clientKey = process.env.REDDIT_CLIENT_KEY
  const secretKey = process.env.REDDIT_SECRET_KEY

  if (!clientKey || !secretKey) return null

  const credentials = Buffer.from(`${clientKey}:${secretKey}`).toString(
    "base64"
  )

  const response = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
      "User-Agent": USER_AGENT,
    },
    body: "grant_type=client_credentials",
  })

  if (!response.ok) {
    log.warn("token fetch failed", { status: response.status })
    return null
  }

  const { access_token, expires_in } = (await response.json()) as {
    access_token: string
    expires_in: number
  }
  if (!access_token) return null

  tokenCache = {
    accessToken: access_token,
    expiresAt: Date.now() + expires_in * 1000,
  }
  return access_token
}

// ─── Browse ────────────────────────────────────────────────────────────────

export interface BrowseRedditResult {
  posts: RedditPost[]
  pages: number
  stoppedEarly: boolean // true = hit startDate boundary before maxPages
}

export async function browseRedditSubreddit(
  subreddit: string,
  sinceTimestamp: number, // Unix seconds — stop paginating when oldest post is older
  untilTimestamp: number, // Unix seconds — skip posts newer than this
  maxPages = 5
): Promise<BrowseRedditResult> {
  const accessToken = await getRedditAccessToken().catch(() => null)
  const baseUrl = accessToken
    ? `https://oauth.reddit.com/r/${subreddit}/new.json`
    : `https://www.reddit.com/r/${subreddit}/new.json`
  const headers: Record<string, string> = { "User-Agent": USER_AGENT }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

  const collected: RedditPost[] = []
  let after: string | null = null
  let pages = 0
  let stoppedEarly = false

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({ limit: "100", raw_json: "1" })
    if (after) params.set("after", after)

    const url = `${baseUrl}?${params.toString()}`
    let children: RedditListingChild[] = []

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        if (attempt > 1) await sleep(1000 * Math.pow(2, attempt - 2))

        const res = await fetch(url, {
          headers,
          signal: AbortSignal.timeout(30000),
        })

        if (res.status === 429) {
          const retryAfter = res.headers.get("retry-after")
          await sleep(retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt)
          continue
        }

        if (!res.ok) break

        const json = (await res.json()) as RedditListing & {
          data: { after: string | null }
        }
        children = json.data.children.filter((c) => c.kind === "t3")
        after = json.data.after ?? null
        break
      } catch {
        if (attempt === 3) break
      }
    }

    pages++

    if (children.length === 0) break

    let hitOldest = false
    for (const child of children) {
      const p = child.data
      const ts = p.created_utc ?? 0
      if (ts < sinceTimestamp) {
        hitOldest = true
        break
      }
      if (ts <= untilTimestamp) {
        collected.push(p)
      }
    }

    if (hitOldest || !after) {
      stoppedEarly = hitOldest
      break
    }
  }

  return { posts: collected, pages, stoppedEarly }
}

// ─── Search ────────────────────────────────────────────────────────────────

export async function searchReddit(
  query: string,
  time: TimeOption = "week",
  limit = 25,
  options?: { community?: string }
): Promise<RedditPost[]> {
  const params = new URLSearchParams({
    q: query,
    sort: "top",
    t: time,
    limit: String(limit),
    type: "link",
    raw_json: "1",
  })

  const accessToken = await getRedditAccessToken().catch(() => null)

  let baseUrl: string
  if (options?.community) {
    params.set("restrict_sr", "on")
    baseUrl = accessToken
      ? `https://oauth.reddit.com/r/${options.community}/search.json`
      : `https://www.reddit.com/r/${options.community}/search.json`
  } else {
    baseUrl = accessToken
      ? "https://oauth.reddit.com/search.json"
      : "https://www.reddit.com/search.json"
  }

  const url = `${baseUrl}?${params.toString()}`

  const headers: Record<string, string> = { "User-Agent": USER_AGENT }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        await sleep(1000 * Math.pow(2, attempt - 2))
      }

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(30000),
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after")
        await sleep(retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt)
        continue
      }

      if (!res.ok) return []

      const json = (await res.json()) as RedditListing
      return json.data.children
        .filter((c) => c.kind === "t3")
        .map((c) => c.data)
    } catch {
      if (attempt === 3) return []
    }
  }

  return []
}

// ─── Fetch Comments ─────────────────────────────────────────────────────────

async function fetchCommentsForPost(
  permalink: string,
  accessToken: string | null,
  limit = 10
): Promise<RedditComment[]> {
  const params = new URLSearchParams({
    sort: "top",
    limit: String(limit),
    depth: "1",
    raw_json: "1",
  })

  const baseUrl = accessToken
    ? `https://oauth.reddit.com${permalink}.json`
    : `https://www.reddit.com${permalink}.json`

  const url = `${baseUrl}?${params.toString()}`
  const headers: Record<string, string> = { "User-Agent": USER_AGENT }
  if (accessToken) headers["Authorization"] = `Bearer ${accessToken}`

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      if (attempt > 1) {
        await sleep(1000 * Math.pow(2, attempt - 2))
      }

      const res = await fetch(url, {
        headers,
        signal: AbortSignal.timeout(15000),
      })

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after")
        await sleep(retryAfter ? parseInt(retryAfter) * 1000 : 2000 * attempt)
        continue
      }

      if (!res.ok) return []

      const json = (await res.json()) as [
        unknown,
        {
          data: {
            children: {
              kind: string
              data: { id: string; body: string; score: number }
            }[]
          }
        },
      ]
      const commentsListing = json[1]

      return commentsListing.data.children
        .filter(
          (comment) =>
            comment.kind === "t1" &&
            comment.data.body !== "[deleted]" &&
            comment.data.body !== "[removed]"
        )
        .map((comment) => ({
          id: comment.data.id,
          body: comment.data.body,
          score: comment.data.score,
        }))
    } catch {
      if (attempt === 3) return []
    }
  }

  return []
}

export async function fetchRedditComments(
  posts: { id: string; permalink: string }[],
  limit = 10
): Promise<Map<string, RedditComment[]>> {
  const result = new Map<string, RedditComment[]>()

  if (posts.length === 0) return result

  const accessToken = await getRedditAccessToken().catch(() => null)

  for (const post of posts) {
    const comments = await fetchCommentsForPost(
      post.permalink,
      accessToken,
      limit
    )
    result.set(post.id, comments)
    await sleep(300)
  }

  return result
}
