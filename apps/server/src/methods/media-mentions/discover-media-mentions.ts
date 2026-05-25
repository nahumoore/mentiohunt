import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { searchBluesky } from "../../helpers/searchers/bluesky-search.js"
import { searchTwitter } from "../../helpers/searchers/twitter-search.js"
import { MEDIA_REQUEST_QUERIES } from "./discovery-terms.js"

const log = createLogger("discover-media-mentions")

const BATCH_SIZE = 20
const CONCURRENCY = 2

interface RawPost {
  id: string
  platform: "twitter" | "bluesky"
  text: string
  author_handle: string
  author_name: string | null
  url: string
  created_at: string
}

interface LlmResult {
  id: string
  is_media_request: boolean
  topic_summary: string | null
  deadline: string | null
  contact_email: string | null
  publication_domain: string | null
}

interface GatherResult {
  posts: RawPost[]
  apifyCostUsd: number
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function today(): string {
  return new Date().toISOString().split("T")[0]!
}

async function gather(): Promise<GatherResult> {
  // Bluesky: use 24h window for better recall (API supports since/until filtering).
  // Twitter: no date filter — Apify actor returns latest with sort:"Latest"; dedup handles repeats.
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const until = new Date().toISOString()

  const tasks: Promise<GatherResult>[] = []

  for (const query of MEDIA_REQUEST_QUERIES) {
    tasks.push(
      searchBluesky(query, 50, { sort: "latest", since, until })
        .then((posts): GatherResult => ({
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
        }))
        .catch((err): GatherResult => {
          log.warn("bluesky query failed", { query, error: String(err) })
          return { posts: [], apifyCostUsd: 0 }
        })
    )
  }

  tasks.push(
    searchTwitter(MEDIA_REQUEST_QUERIES, { maxItems: 200 }).then(
      ({ posts, costUsd }): GatherResult => ({
        posts: posts.map((p) => ({
          id: `twitter:${p.id}`,
          platform: "twitter",
          text: p.text,
          author_handle: p.author_handle,
          author_name: p.author_name,
          url: p.url,
          created_at: p.created_at,
        })),
        apifyCostUsd: costUsd,
      })
    ).catch((err) => {
      log.warn("twitter search failed", { error: String(err) })
      return { posts: [], apifyCostUsd: 0 }
    })
  )

  const results = await Promise.all(tasks)
  const apifyCostUsd = results.reduce((sum, result) => sum + result.apifyCostUsd, 0)

  const seen = new Set<string>()
  const deduped: RawPost[] = []
  for (const result of results) {
    for (const post of result.posts) {
      if (!seen.has(post.url)) {
        seen.add(post.url)
        deduped.push(post)
      }
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

async function prefilterExisting(posts: RawPost[]): Promise<RawPost[]> {
  if (posts.length === 0) return []

  const urls = posts.map((p) => p.url)
  const windowStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

  const { data, error } = await supabaseAdmin
    .from("media_mentions")
    .select("url")
    .in("url", urls)
    .gte("created_at", windowStart)

  if (error) {
    log.warn("prefilter query failed, skipping", { error: error.message })
    return posts
  }

  const existing = new Set((data ?? []).map((r) => r.url))
  const fresh = posts.filter((p) => !existing.has(p.url))

  log.info("prefilter complete", {
    input: posts.length,
    existing: existing.size,
    fresh: fresh.length,
  })

  return fresh
}

const CLASSIFY_RETRY_DELAYS_MS = [2_000, 8_000, 30_000]

function isRateLimitError(err: unknown): boolean {
  const msg = String(err)
  return msg.includes("rate_limit_exceeded") || msg.includes('"code":429') || msg.includes("429")
}

async function classifyBatch(
  posts: RawPost[]
): Promise<{ results: LlmResult[]; cost: number }> {
  const payload = posts.map((p) => ({ id: p.id, text: p.text, url: p.url }))

  const systemInstructions = `You are classifying social media posts to find genuine media requests — journalists, PR professionals, or producers publicly looking for sources, expert quotes, case studies, or product mentions for a story or publication.

Mark is_media_request: true ONLY when the post is clearly a request from a media professional or student journalist looking for sources/experts/products.
Mark is_media_request: false for: promotional posts, personal opinions, jokes, generic networking, or posts that merely mention a journalism hashtag without actually requesting anything.

For each post, extract:
- topic_summary: 1-sentence description of what the journalist is covering (null if not a media request)
- deadline: deadline date as YYYY-MM-DD if explicitly stated, else null
- contact_email: email address visible in the post text, else null
- publication_domain: domain of the publication/outlet if mentioned (e.g. "techcrunch.com"), else null`

  const requestOptions = {
    model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
    systemInstructions,
    thinkingBudget: 2000,
    input: `Posts:\n${JSON.stringify(payload, null, 2)}`,
    responseFormat: {
      type: "json_schema" as const,
      json_schema: {
        name: "media_request_classification",
        strict: true,
        schema: {
          type: "object",
          properties: {
            results: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  id: { type: "string" },
                  is_media_request: { type: "boolean" },
                  topic_summary: { type: ["string", "null"] },
                  deadline: { type: ["string", "null"] },
                  contact_email: { type: ["string", "null"] },
                  publication_domain: { type: ["string", "null"] },
                },
                required: [
                  "id",
                  "is_media_request",
                  "topic_summary",
                  "deadline",
                  "contact_email",
                  "publication_domain",
                ],
                additionalProperties: false,
              },
            },
          },
          required: ["results"],
          additionalProperties: false,
        },
      },
    },
  }

  let lastErr: unknown
  for (let attempt = 0; attempt <= CLASSIFY_RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { text, cost } = await generateTextWithUsage(requestOptions)

      let parsed: { results: LlmResult[] }
      try {
        parsed = JSON.parse(text) as typeof parsed
      } catch (parseErr) {
        log.warn("classify batch json parse failed", { error: String(parseErr) })
        return { results: [], cost }
      }

      return { results: parsed.results, cost }
    } catch (err) {
      lastErr = err
      if (isRateLimitError(err) && attempt < CLASSIFY_RETRY_DELAYS_MS.length) {
        const delay = CLASSIFY_RETRY_DELAYS_MS[attempt]!
        log.warn("classify batch rate limited, retrying", { attempt: attempt + 1, delay_ms: delay })
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  log.warn("classify batch failed", { error: String(lastErr) })
  return { results: [], cost: 0 }
}

async function classify(
  posts: RawPost[]
): Promise<{ kept: Array<{ post: RawPost; llm: LlmResult }>; totalCost: number }> {
  if (posts.length === 0) return { kept: [], totalCost: 0 }

  const batches = chunk(posts, BATCH_SIZE)
  const limit = pLimit(CONCURRENCY)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => classifyBatch(batch)))
  )

  const llmById = new Map<string, LlmResult>()
  let totalCost = 0
  for (const { results, cost } of batchResults) {
    totalCost += cost
    for (const r of results) llmById.set(r.id, r)
  }

  const postById = new Map(posts.map((p) => [p.id, p]))
  const kept: Array<{ post: RawPost; llm: LlmResult }> = []

  for (const [id, llm] of llmById) {
    if (!llm.is_media_request) continue
    const post = postById.get(id)
    if (post) kept.push({ post, llm })
  }

  log.info("classification complete", {
    input: posts.length,
    kept: kept.length,
    cost_usd: totalCost.toFixed(4),
  })

  return { kept, totalCost }
}

export async function discoverMediaMentions(): Promise<void> {
  log.info("discovery started")

  const { posts: raw, apifyCostUsd } = await gather()
  const fresh = await prefilterExisting(raw)
  const { kept, totalCost } = await classify(fresh)

  if (kept.length === 0) {
    log.info("no new media requests found", {
      llm_cost_usd: totalCost.toFixed(4),
      apify_cost_usd: apifyCostUsd.toFixed(4),
    })
    return
  }

  const todayStr = today()

  const rows = kept.map(({ post, llm }) => ({
    source: post.platform,
    url: post.url,
    author_name: post.author_name,
    author_handle: post.author_handle,
    contact_email: llm.contact_email,
    publication_domain: llm.publication_domain,
    topic_summary: llm.topic_summary,
    deadline: post.platform === "twitter" || post.platform === "bluesky" ? null : (llm.deadline ?? todayStr),
    raw_text: post.text,
    raw_body: null,
    submitted_at: post.created_at,
  }))

  const { data: inserted, error } = await supabaseAdmin
    .from("media_mentions")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
    .select("id, source")

  if (error) {
    log.error("upsert failed", { error: error.message })
    return
  }

  const insertedRows = inserted ?? []
  const bySource = insertedRows.reduce<Record<string, number>>((acc, r) => {
    acc[r.source] = (acc[r.source] ?? 0) + 1
    return acc
  }, {})

  log.info("discovery complete", {
    raw: raw.length,
    prefilter_kept: fresh.length,
    llm_kept: kept.length,
    inserted: insertedRows.length,
    by_source: bySource,
    llm_cost_usd: totalCost.toFixed(4),
    apify_cost_usd: apifyCostUsd.toFixed(4),
  })
}
