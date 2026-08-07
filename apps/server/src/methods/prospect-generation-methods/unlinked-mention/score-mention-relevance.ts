import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"

const log = createLogger("score-mention-relevance")

export type MentionCandidate = {
  url: string
  title: string
  snippet: string
}

export type ScoredMention = MentionCandidate & {
  relevanceScore: number
  relevanceReason: string
}

const BATCH_SIZE = 20

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const SYSTEM_INSTRUCTIONS = (product: { product_name: string; product_description: string }) =>
  `You are evaluating web pages that already mention this product by name but do not link to it. Score how worthwhile each page is as a link-reclamation outreach target.

Product: ${product.product_name}
Description: ${product.product_description}

Each item is a page that mentions the product. Score whether it is a genuine, relevant mention where asking the author to add a link is reasonable.

Score guide (1-5):
- 5: Genuine editorial mention in a relevant article/roundup/review — a link clearly belongs
- 4: Relevant mention, link would fit naturally
- 3: Mention is real but context is thin or tangential
- 2: Weak — coincidental name match or low-quality page
- 1: Not a real mention of THIS product (different company sharing the name, spam, scraped/aggregator junk)

Return ALL items with their scores and a one-line reason.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "mention_relevance_scores",
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
              score: { type: "number" },
              reason: { type: "string" },
            },
            required: ["id", "score", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

export async function scoreMentionRelevance(
  items: MentionCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: ScoredMention[]; totalCost: number }> {
  if (items.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(5)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => scoreBatch(batch, product)))
  )

  const results = batchResults.flatMap((r) => r.results)
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  log.info("scoring complete", {
    total: items.length,
    scored: results.length,
    passing: results.filter((r) => r.relevanceScore >= 3).length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function scoreBatch(
  items: MentionCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: ScoredMention[]; cost: number }> {
  const payload = items.map((item) => ({
    id: item.url,
    title: item.title || "(no title)",
    snippet: item.snippet || "(no snippet)",
  }))

  try {
    return await withLlmRetries(log, async () => {
      const input = `Pages:\n${JSON.stringify(payload, null, 2)}`
      log.info("llm request", {
        model: OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH,
        fallbackModels: [OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH,
        fallbackModels: [OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = parseLlmJson<{ results: { id: string; score: number; reason: string }[] }>(text)

      if (!Array.isArray(parsed?.results)) {
        throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
      }

      const scoreById = new Map(parsed.results.map((r) => [r.id, r]))

      const scored: ScoredMention[] = items
        .map((item) => {
          const s = scoreById.get(item.url)
          if (!s) return null
          return {
            ...item,
            relevanceScore: Math.round(s.score),
            relevanceReason: s.reason,
          }
        })
        .filter((r): r is ScoredMention => r !== null)

      if (scored.length < items.length) {
        log.warn("id mismatch: some items unscored", {
          sentIds: items.map((i) => i.url),
          returnedIds: parsed.results.map((r) => r.id),
          missingIds: items.filter((i) => !scoreById.has(i.url)).map((i) => i.url),
          rawResponse: text,
        })
      }

      log.info("batch scored", { model: modelUsed, items: scored.length })

      for (const r of scored) {
        log.info("scored item", {
          url: r.url,
          title: r.title || "(no title)",
          score: r.relevanceScore,
          passed: r.relevanceScore >= 3,
          reason: r.relevanceReason,
        })
      }

      return { results: scored, cost }
    })
  } catch (err) {
    log.warn("scoring failed", { error: String(err) })
    return { results: [], cost: 0 }
  }
}
