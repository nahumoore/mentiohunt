import { createLogger } from "../../helpers/logger.js"

const log = createLogger("reddit-fetch-user")

const REDDIT_USER_AGENT = "mentiohunt-free-tool/1.0"
const FETCH_TIMEOUT_MS = 10_000

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
    is_self?: boolean
  }
}

type RedditListingData = {
  data?: {
    children?: RedditListingChild[]
  }
  error?: number
  message?: string
}

async function redditFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": REDDIT_USER_AGENT },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  })

  if (res.status === 404) throw new Error("reddit_user_not_found")
  if (res.status === 403) throw new Error("reddit_user_private_or_suspended")
  if (!res.ok) throw new Error(`reddit_api_error_${res.status}`)

  return res.json() as Promise<T>
}

export async function fetchRedditUserData(username: string): Promise<RedditUserData> {
  const base = `https://www.reddit.com/user/${encodeURIComponent(username)}`

  const [about, comments, submitted] = await Promise.all([
    redditFetch<RedditAboutData>(`${base}/about.json`),
    redditFetch<RedditListingData>(`${base}/comments.json?limit=100&raw_json=1`),
    redditFetch<RedditListingData>(`${base}/submitted.json?limit=100&raw_json=1`),
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

  // Aggregate subreddit activity
  const map = new Map<string, RawSubredditEntry>()

  function upsert(subreddit: string, isPost: boolean, score: number) {
    const key = subreddit.toLowerCase()
    const existing = map.get(key) ?? {
      subreddit,
      postsCount: 0,
      commentsCount: 0,
      totalScore: 0,
    }
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

  // Sort by total activity, keep top 12
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
