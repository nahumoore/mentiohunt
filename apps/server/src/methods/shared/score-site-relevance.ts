import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"

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

export async function scoreSiteRelevance(
  items: SiteRelevanceInput[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, { score: number }>; cost: number }> {
  if (items.length === 0) return { results: new Map(), cost: 0 }

  try {
    const payload = items.map((item) => ({
      id: item.id,
      domain: item.domain,
      title: item.title || "(no title)",
      context: item.snippet || "(no context)",
    }))

    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
      systemInstructions: SYSTEM_INSTRUCTIONS(product),
      input: `Sites:\n${JSON.stringify(payload, null, 2)}`,
      responseFormat: RESPONSE_FORMAT,
    })

    let parsed: { results: { id: string; score: number }[] }
    try {
      parsed = JSON.parse(text) as typeof parsed
    } catch {
      log.warn("json parse failed")
      return { results: new Map(), cost: 0 }
    }

    const results = new Map(
      parsed.results.map((r) => [r.id, { score: Math.round(r.score) }])
    )

    log.info("scoring complete", { count: items.length, cost_usd: cost.toFixed(4) })

    return { results, cost }
  } catch (err) {
    log.warn("scoring failed", { error: String(err) })
    return { results: new Map(), cost: 0 }
  }
}
