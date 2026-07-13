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
  product: { product_name: string; product_description: string },
  model: (typeof OPENROUTER_MODELS)[keyof typeof OPENROUTER_MODELS]
): Promise<{ results: Map<string, { score: number }>; cost: number; modelUsed: string }> {
  const payload = items.map((item) => ({
    id: item.id,
    domain: item.domain,
    title: item.title || "(no title)",
    context: item.snippet || "(no context)",
  }))

  return withLlmRetries(log, async () => {
    const { text, cost, modelUsed } = await generateTextWithUsage({
      model,
      fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
      systemInstructions: SYSTEM_INSTRUCTIONS(product),
      input: `Sites:\n${JSON.stringify(payload, null, 2)}`,
      responseFormat: RESPONSE_FORMAT,
    })

    const parsed = JSON.parse(text) as { results: { id: string; score: number }[] }

    if (!Array.isArray(parsed?.results)) {
      throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
    }

    const results = new Map(
      parsed.results.map((r) => [r.id, { score: Math.round(r.score) }])
    )

    return { results, cost, modelUsed }
  })
}

export async function scoreSiteRelevance(
  items: SiteRelevanceInput[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, { score: number }>; cost: number }> {
  if (items.length === 0) return { results: new Map(), cost: 0 }

  try {
    const { results, cost: firstCost, modelUsed: firstModelUsed } = await scoreBatch(
      items,
      product,
      OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH
    )
    let totalCost = firstCost
    const modelsUsed = [firstModelUsed]

    const missingItems = items.filter((item) => !results.has(item.id))

    if (missingItems.length > 0) {
      log.warn("missing ids in response, retrying", {
        requested: items.length,
        missing: missingItems.length,
        missingIds: missingItems.map((item) => item.id),
      })

      const { results: retryResults, cost: retryCost, modelUsed: retryModelUsed } = await scoreBatch(
        missingItems,
        product,
        OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH
      )
      totalCost += retryCost
      modelsUsed.push(retryModelUsed)

      for (const [id, score] of retryResults) results.set(id, score)

      const stillMissing = missingItems.filter((item) => !results.has(item.id))
      if (stillMissing.length > 0) {
        log.warn("ids missing after retry", { missingIds: stillMissing.map((item) => item.id) })
      }
    }

    log.info("scoring complete", {
      requested: items.length,
      scored: results.size,
      cost_usd: totalCost.toFixed(4),
      modelsUsed,
    })

    return { results, cost: totalCost }
  } catch (err) {
    log.warn("scoring failed", { error: String(err) })
    return { results: new Map(), cost: 0 }
  }
}
