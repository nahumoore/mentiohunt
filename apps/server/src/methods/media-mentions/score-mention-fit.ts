import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("media-mentions-score-fit")

export const MIN_FIT_SCORE = 70
const BATCH_SIZE = 20
const SCORE_THINKING_BUDGET = 2000

export interface MentionFitResult {
  mentionId: string
  fitScore: number
  reason: string
}

interface MentionInput {
  id: string
  topic_summary: string | null
  publication_domain: string | null
  url: string | null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function scoreMentionFit(
  product: { product_name: string; product_description: string; website_url: string },
  mentions: MentionInput[]
): Promise<{ results: MentionFitResult[]; totalCost: number }> {
  if (mentions.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(mentions, BATCH_SIZE)
  const limit = pLimit(5)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => scoreBatch(product, batch)))
  )

  const results = batchResults.flatMap((r) => r.results)
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  log.info("fit scoring complete", {
    total: mentions.length,
    passing: results.filter((r) => r.fitScore >= MIN_FIT_SCORE).length,
  })

  return { results, totalCost }
}

async function scoreBatch(
  product: { product_name: string; product_description: string; website_url: string },
  mentions: MentionInput[]
): Promise<{ results: MentionFitResult[]; cost: number }> {
  const payload = mentions.map((m) => ({
    id: m.id,
    topic_summary: m.topic_summary ?? "(no summary)",
    publication_domain: m.publication_domain ?? "(unknown)",
  }))

  const systemInstructions = `You are a backlink opportunity scoring assistant.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

You are given a list of media mentions — articles or coverage by journalists and publications. For each mention, score how relevant it would be to reach out to that publication asking them to mention or link to this product.

Scoring guide (fit_score 1-100):
- 90-100: Article topic is directly in the product's space; publication clearly covers this audience; a backlink would be highly relevant.
- 70-89: Topic is adjacent or partially relevant; the publication likely reaches some of the product's audience.
- 50-69: Loose topical connection; product mention would feel forced.
- <50: No meaningful topical relationship.

Return ALL mentions with their scores and a one-sentence reason.`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
      systemInstructions,
      thinkingBudget: SCORE_THINKING_BUDGET,
      input: `Mentions:\n${JSON.stringify(payload, null, 2)}`,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "mention_fit_scores",
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
                    fit_score: { type: "number" },
                    reason: { type: "string" },
                  },
                  required: ["id", "fit_score", "reason"],
                  additionalProperties: false,
                },
              },
            },
            required: ["results"],
            additionalProperties: false,
          },
        },
      },
    })

    let parsed: { results: { id: string; fit_score: number; reason: string }[] }
    try {
      parsed = JSON.parse(text) as typeof parsed
    } catch (parseErr) {
      log.warn("score batch json parse failed", { error: String(parseErr), rawText: text })
      return { results: [], cost }
    }

    const scored: MentionFitResult[] = parsed.results.map((r) => ({
      mentionId: r.id,
      fitScore: Math.round(r.fit_score),
      reason: r.reason,
    }))

    return { results: scored, cost }
  } catch (err) {
    log.warn("score batch failed", { error: String(err) })
    return { results: [], cost: 0 }
  }
}
