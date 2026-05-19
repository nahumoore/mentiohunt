import { createLogger } from "../logger.js"

const log = createLogger("bluesky-search")

interface TokenCache {
  accessJwt: string
  expiresAt: number
}

interface BlueskyAuthor {
  did: string
  handle: string
  displayName?: string
  avatar?: string
}

interface BlueskyRecord {
  $type: string
  createdAt: string
  text: string
  reply?: {
    parent: {
      cid: string
      uri: string
    }
    root: {
      cid: string
      uri: string
    }
  }
}

interface BlueskyPostRecord {
  uri: string
  cid: string
  author: BlueskyAuthor
  record: BlueskyRecord
  replyCount: number
  repostCount: number
  likeCount: number
  quoteCount: number
  indexedAt: string
}

interface BlueskySearchResponse {
  posts?: BlueskyPostRecord[]
  cursor?: string
}

interface BlueskyGetPostsResponse {
  posts?: BlueskyPostRecord[]
}

export interface BlueskyPost {
  id: string
  text: string
  author_handle: string
  author_display_name: string | null
  author_avatar: string | null
  reply_count: number
  repost_count: number
  like_count: number
  quote_count: number
  created_at: string
  url: string
  parent_post?: BlueskyPost | null
}

let tokenCache: TokenCache | null = null

function mapBlueskyPost(post: BlueskyPostRecord): BlueskyPost {
  const id = post.uri.split("/").pop() ?? post.cid

  return {
    id,
    text: post.record.text,
    author_handle: post.author.handle,
    author_display_name: post.author.displayName ?? null,
    author_avatar: post.author.avatar ?? null,
    reply_count: post.replyCount,
    repost_count: post.repostCount,
    like_count: post.likeCount,
    quote_count: post.quoteCount,
    created_at: post.record.createdAt,
    url: `https://bsky.app/profile/${post.author.handle}/post/${id}`,
    parent_post: null,
  }
}

async function getBlueskyAccessToken(): Promise<string | null> {
  if (tokenCache && Date.now() < tokenCache.expiresAt - 5 * 60 * 1000) {
    return tokenCache.accessJwt
  }

  try {
    const clientKey = process.env.BLUESKY_CLIENT_KEY
    const secretKey = process.env.BLUESKY_SECRET_KEY

    if (!clientKey || !secretKey) {
      return null
    }

    const response = await fetch(
      "https://bsky.social/xrpc/com.atproto.server.createSession",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Mentiohunt/1.0",
        },
        body: JSON.stringify({
          identifier: clientKey,
          password: secretKey,
        }),
        signal: AbortSignal.timeout(30_000),
      }
    )

    if (!response.ok) {
      log.warn("token fetch failed", { status: response.status })
      return null
    }

    const sessionData = (await response.json()) as { accessJwt?: string }
    if (!sessionData.accessJwt) {
      return null
    }

    tokenCache = {
      accessJwt: sessionData.accessJwt,
      expiresAt: Date.now() + 2 * 60 * 60 * 1000,
    }

    return sessionData.accessJwt
  } catch {
    return null
  }
}

export async function fetchBlueskyParentPost(
  post: BlueskyPostRecord,
  accessJwt?: string
): Promise<BlueskyPost | null> {
  const parentUri = post.record.reply?.parent.uri
  if (!parentUri) return null

  const jwt = accessJwt ?? (await getBlueskyAccessToken())
  if (!jwt) return null

  try {
    const params = new URLSearchParams({
      uris: parentUri,
    })

    const response = await fetch(
      `https://bsky.social/xrpc/app.bsky.feed.getPosts?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${jwt}`,
          "User-Agent": "Mentiohunt/1.0",
        },
        signal: AbortSignal.timeout(30_000),
      }
    )

    if (!response.ok) return null

    const data = (await response.json()) as BlueskyGetPostsResponse
    const parentPost = data.posts?.[0]

    return parentPost ? mapBlueskyPost(parentPost) : null
  } catch {
    return null
  }
}

export async function searchBluesky(
  query: string,
  limit = 20,
  options?: {
    sort?: "top" | "latest"
    since?: string
    until?: string
  }
): Promise<BlueskyPost[]> {
  const accessJwt = await getBlueskyAccessToken()
  if (!accessJwt) return []

  const params = new URLSearchParams({
    q: query,
    limit: String(Math.min(limit, 100)),
    sort: options?.sort ?? "top",
  })

  if (options?.since) params.set("since", options.since)
  if (options?.until) params.set("until", options.until)

  try {
    const response = await fetch(
      `https://bsky.social/xrpc/app.bsky.feed.searchPosts?${params.toString()}`,
      {
        headers: {
          Authorization: `Bearer ${accessJwt}`,
          "User-Agent": "Mentiohunt/1.0",
        },
        signal: AbortSignal.timeout(30_000),
      }
    )

    if (!response.ok) return []

    const data = (await response.json()) as BlueskySearchResponse
    const rawPosts = data.posts ?? []
    const mappedPosts = rawPosts.map(mapBlueskyPost)

    const replyIndices = rawPosts.reduce<number[]>((acc, p, i) => {
      if (p.record.reply?.parent.uri) acc.push(i)
      return acc
    }, [])

    if (replyIndices.length > 0) {
      const parentUriToIndex = new Map(
        replyIndices.flatMap((i) => {
          const uri = rawPosts[i]?.record.reply?.parent.uri
          return uri ? [[uri, i] as [string, number]] : []
        })
      )
      const uniqueUris = [...parentUriToIndex.keys()]

      const parentParams = new URLSearchParams()
      for (const uri of uniqueUris) parentParams.append("uris", uri)

      try {
        const parentResponse = await fetch(
          `https://bsky.social/xrpc/app.bsky.feed.getPosts?${parentParams.toString()}`,
          {
            headers: {
              Authorization: `Bearer ${accessJwt}`,
              "User-Agent": "Mentiohunt/1.0",
            },
            signal: AbortSignal.timeout(15_000),
          }
        )

        if (parentResponse.ok) {
          const parentData = (await parentResponse.json()) as BlueskyGetPostsResponse
          const parentByUri = new Map(
            (parentData.posts ?? []).map((p) => [p.uri, mapBlueskyPost(p)])
          )
          for (const [uri, idx] of parentUriToIndex) {
            const parent = parentByUri.get(uri)
            const mapped = mappedPosts[idx]
            if (parent && mapped) mapped.parent_post = parent
          }
        }
      } catch {
        // parent fetch is best-effort, continue without
      }
    }

    return mappedPosts
  } catch {
    return []
  }
}
