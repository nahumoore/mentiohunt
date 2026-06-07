import { createLogger } from "../../helpers/logger.js"

const log = createLogger("reddit-fetch-user")

const REDDIT_USER_AGENT = "mentiohunt-free-tool/1.0 (by /u/mentiohunt)"
const FETCH_TIMEOUT_MS = 12_000

export type RedditProfile = {
  username: string
  totalKarma: number
  commentKarma: number
  postKarma: number
  accountAgeDays: number
}

export type RawSubredditEntry = {
  subreddit: string
  postsCount: number
  commentsCount: number
  totalScore: number
}

export type RedditUserData = {
  profile: RedditProfile
  subreddits: RawSubredditEntry[]
}

// In-memory token cache — single instance, resets on restart
let cachedToken: { value: string; expiresAt: number } | null = null

async function getAccessToken(): Promise<string> {
  const now = Date.now()
  if (cachedToken && cachedToken.expiresAt > now + 60_000) {
    return cachedToken.value
  }

  const clientId = process.env.REDDIT_CLIENT_KEY
  const clientSecret = process.env.REDDIT_SECRET_KEY

  if (!clientId || !clientSecret) {
    throw new Error("Missing REDDIT_CLIENT_KEY or REDDIT_SECRET_KEY")
  }

  const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString("base64")

  const res = await fetch("https://www.reddit.com/api/v1/access_token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${credentials}`,
      "User-Agent": REDDIT_USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (!res.ok) {
    throw new Error(`Reddit OAuth failed: ${res.status}`)
  }

  const data = (await res.json()) as { access_token?: string; expires_in?: number }

  if (!data.access_token) throw new Error("Reddit OAuth returned no token")

  cachedToken = {
    value: data.access_token,
    expiresAt: now + (data.expires_in ?? 3600) * 1000,
  }

  log.info("obtained new Reddit access token")
  return cachedToken.value
}

type RedditAboutData = {
  data?: {
    name?: string
    total_karma?: number
    comment_karma?: number
    link_karma?: number
    created_utc?: number
    is_suspended?: boolean
  }
  error?: number
  message?: string
}

type RedditListingChild = {
  data?: {
    subreddit?: string
    score?: number
  }
}

type RedditListingData = {
  data?: {
    children?: RedditListingChild[]
  }
  error?: number
  message?: string
}

async function redditFetch<T>(path: string, token: string): Promise<T> {
  const res = await fetch(`https://oauth.reddit.com${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": REDDIT_USER_AGENT,
    },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (res.status === 404) throw new Error("reddit_user_not_found")
  if (res.status === 403) throw new Error("reddit_user_private_or_suspended")
  if (!res.ok) throw new Error(`reddit_api_error_${res.status}`)

  return res.json() as Promise<T>
}

async function safeListingFetch(path: string, token: string): Promise<RedditListingData> {
  try {
    return await redditFetch<RedditListingData>(path, token)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    // If listings fail (private history, forbidden), treat as empty rather than erroring
    if (msg !== "reddit_user_not_found") {
      log.warn("listing fetch failed, treating as empty", { path, error: msg })
      return {}
    }
    throw err
  }
}

export function extractUsername(input: string): string {
  const trimmed = input.trim()

  // Full URL: https://www.reddit.com/user/foo or https://reddit.com/u/foo
  try {
    const url = new URL(trimmed.startsWith("http") ? trimmed : `https://${trimmed}`)
    if (url.hostname.includes("reddit.com")) {
      const match = url.pathname.match(/^\/(user|u)\/([a-zA-Z0-9_-]+)/i)
      if (match?.[2]) return match[2]
    }
  } catch {
    // not a URL — fall through
  }

  // u/username or /u/username
  const uPrefix = trimmed.match(/^\/?u\/([a-zA-Z0-9_-]+)/i)
  if (uPrefix?.[1]) return uPrefix[1]

  return trimmed
}

export async function fetchRedditUserData(username: string): Promise<RedditUserData> {
  const token = await getAccessToken()
  const encoded = encodeURIComponent(username)

  const [about, comments, submitted] = await Promise.all([
    redditFetch<RedditAboutData>(`/user/${encoded}/about`, token),
    safeListingFetch(`/user/${encoded}/comments?limit=100&raw_json=1`, token),
    safeListingFetch(`/user/${encoded}/submitted?limit=100&raw_json=1`, token),
  ])

  if (about.error === 404 || !about.data) throw new Error("reddit_user_not_found")
  if (about.data.is_suspended) throw new Error("reddit_user_private_or_suspended")

  const nowSec = Date.now() / 1000
  const createdUtc = about.data.created_utc ?? nowSec
  const accountAgeDays = Math.floor((nowSec - createdUtc) / 86400)

  const profile: RedditProfile = {
    username: about.data.name ?? username,
    totalKarma: about.data.total_karma ?? 0,
    commentKarma: about.data.comment_karma ?? 0,
    postKarma: about.data.link_karma ?? 0,
    accountAgeDays,
  }

  const map = new Map<string, RawSubredditEntry>()

  function upsert(subreddit: string, isPost: boolean, score: number) {
    const key = subreddit.toLowerCase()
    const existing = map.get(key) ?? { subreddit, postsCount: 0, commentsCount: 0, totalScore: 0 }
    if (isPost) existing.postsCount++
    else existing.commentsCount++
    existing.totalScore += score
    map.set(key, existing)
  }

  for (const child of submitted.data?.children ?? []) {
    const d = child.data
    if (d?.subreddit) upsert(d.subreddit, true, d.score ?? 0)
  }

  for (const child of comments.data?.children ?? []) {
    const d = child.data
    if (d?.subreddit) upsert(d.subreddit, false, d.score ?? 0)
  }

  const subreddits = [...map.values()]
    .sort((a, b) => (b.postsCount + b.commentsCount) - (a.postsCount + a.commentsCount))
    .slice(0, 12)

  log.info("fetched user data", {
    username,
    totalKarma: profile.totalKarma,
    subredditsFound: map.size,
    subredditsKept: subreddits.length,
  })

  return { profile, subreddits }
}
