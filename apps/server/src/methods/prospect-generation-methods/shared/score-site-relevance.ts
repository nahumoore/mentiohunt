import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"

const log = createLogger("score-site-relevance")

export type SiteRelevanceInput = {
  id: string
  domain: string
  title: string
  snippet: string
}

const BATCH_SIZE = 20

const FALLBACK_MODELS = [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO]

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const SYSTEM_INSTRUCTIONS = (product: { product_name: string; product_description: string }) =>
  `You are evaluating websites as backlink outreach targets for a software product. Assess how well each site's audience and topic area aligns with this product's target market — not just the specific page, but the site as a whole.

Product: ${product.product_name}
Description: ${product.product_description}

Score guide (0-100):
- 90-100: Perfect match — site squarely serves this product's ICP, backlink placement highly relevant
- 70-89: Strong alignment — audience overlaps significantly with product's target market
- 50-69: Moderate alignment — some overlap but not the site's core focus
- 25-49: Weak alignment — tangential connection, audience unlikely to care about this product
- 0-24: No alignment — different market entirely

Return only a numeric score (integer, 0-100) per site.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "site_relevance_scores",
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
            },
            required: ["id", "score"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

async function scoreBatch(
  items: SiteRelevanceInput[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, { score: number }>; cost: number }> {
  const payload = items.map((item) => ({
    id: item.id,
    domain: item.domain,
    title: item.title || "(no title)",
    context: item.snippet || "(no context)",
  }))

  try {
    return await withLlmRetries(log, async () => {
      const input = `Sites:\n${JSON.stringify(payload, null, 2)}`
      log.info("llm request", {
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: FALLBACK_MODELS,
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: FALLBACK_MODELS,
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = JSON.parse(text) as { results: { id: string; score: number }[] }

      if (!Array.isArray(parsed?.results)) {
        throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
      }

      const results = new Map(
        parsed.results.map((r) => [r.id, { score: Math.round(r.score) }])
      )

      log.info("batch scored", { model: modelUsed, items: results.size })

      return { results, cost }
    })
  } catch (err) {
    log.warn("batch scoring failed", { error: String(err) })
    return { results: new Map(), cost: 0 }
  }
}

export async function scoreSiteRelevance(
  items: SiteRelevanceInput[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, { score: number }>; cost: number }> {
  if (items.length === 0) return { results: new Map(), cost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(5)

  const batchOutcomes = await Promise.all(
    batches.map((batch) => limit(() => scoreBatch(batch, product)))
  )

  const results = new Map<string, { score: number }>()
  let totalCost = 0
  for (const outcome of batchOutcomes) {
    for (const [id, score] of outcome.results) results.set(id, score)
    totalCost += outcome.cost
  }

  const missingItems = items.filter((item) => !results.has(item.id))
  if (missingItems.length > 0) {
    log.warn("missing ids after batch scoring, retrying", {
      requested: items.length,
      missing: missingItems.length,
      missingIds: missingItems.map((item) => item.id),
    })

    const retryOutcome = await scoreBatch(missingItems, product)
    totalCost += retryOutcome.cost
    for (const [id, score] of retryOutcome.results) results.set(id, score)

    const stillMissing = missingItems.filter((item) => !results.has(item.id))
    if (stillMissing.length > 0) {
      log.warn("ids missing after retry", { missingIds: stillMissing.map((item) => item.id) })
    }
  }

  log.info("scoring complete", {
    requested: items.length,
    scored: results.size,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, cost: totalCost }
}
