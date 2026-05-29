import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import type { RawPost } from "./gather-media-posts.js"

const log = createLogger("classify-media-requests")

const BATCH_SIZE = 20
const CONCURRENCY = 2
const RETRY_DELAYS_MS = [2_000, 8_000, 30_000]

export interface LlmClassification {
  id: string
  is_media_request: boolean
  topic_summary: string | null
  deadline: string | null
  contact_email: string | null
  contact_name: string | null
  publication_domain: string | null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function isRateLimitError(err: unknown): boolean {
  const msg = String(err)
  return msg.includes("rate_limit_exceeded") || msg.includes('"code":429') || msg.includes("429")
}

async function classifyBatch(
  posts: RawPost[]
): Promise<{ results: LlmClassification[]; cost: number }> {
  const payload = posts.map((p) => ({ id: p.id, text: p.text, url: p.url }))

  const systemInstructions = `You are classifying social media posts to find genuine media requests — journalists, PR professionals, or producers publicly looking for sources, expert quotes, case studies, or product mentions for a story or publication.

Mark is_media_request: true ONLY when the post is clearly a request from a media professional or student journalist looking for sources/experts/products.
Mark is_media_request: false for: promotional posts, personal opinions, jokes, generic networking, or posts that merely mention a journalism hashtag without actually requesting anything.

For each post, extract:
- topic_summary: 1-sentence description of what the journalist is covering (null if not a media request)
- deadline: deadline date as YYYY-MM-DD if explicitly stated, else null
- contact_email: email address visible in the post text, else null
- contact_name: the journalist or requester's actual personal name if mentioned in the post text (e.g. "Jane Smith"), else null. Do NOT use account/brand names like "MediaMatchMaker", "HARO", "journorequest_" — only real individual names.
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
                  contact_name: { type: ["string", "null"] },
                  publication_domain: { type: ["string", "null"] },
                },
                required: [
                  "id",
                  "is_media_request",
                  "topic_summary",
                  "deadline",
                  "contact_email",
                  "contact_name",
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
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { text, cost } = await generateTextWithUsage(requestOptions)

      let parsed: { results: LlmClassification[] }
      try {
        parsed = JSON.parse(text) as typeof parsed
      } catch (parseErr) {
        log.warn("classify batch json parse failed", { error: String(parseErr) })
        return { results: [], cost }
      }

      const keptCount = parsed.results.filter((r) => r.is_media_request).length
      log.info("classify batch result", {
        input: posts.length,
        kept: keptCount,
        cost_usd: cost.toFixed(4),
      })
      return { results: parsed.results, cost }
    } catch (err) {
      lastErr = err
      if (isRateLimitError(err) && attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt]!
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

export async function classifyMediaRequests(posts: RawPost[]): Promise<{
  kept: Array<{ post: RawPost; llm: LlmClassification }>
  totalCost: number
}> {
  if (posts.length === 0) return { kept: [], totalCost: 0 }

  const batches = chunk(posts, BATCH_SIZE)
  const limit = pLimit(CONCURRENCY)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => classifyBatch(batch)))
  )

  const llmById = new Map<string, LlmClassification>()
  let totalCost = 0
  for (const { results, cost } of batchResults) {
    totalCost += cost
    for (const r of results) llmById.set(r.id, r)
  }

  const postById = new Map(posts.map((p) => [p.id, p]))
  const kept: Array<{ post: RawPost; llm: LlmClassification }> = []

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

  for (const { post, llm } of kept) {
    log.info("classified as media request", {
      postId: post.id,
      platform: post.platform,
      author: post.author_handle,
      topic_summary: llm.topic_summary,
      publication_domain: llm.publication_domain,
      deadline: llm.deadline,
      has_contact_email: !!llm.contact_email,
      url: post.url,
    })
  }

  return { kept, totalCost }
}
