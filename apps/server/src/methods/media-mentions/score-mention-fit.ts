import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("media-mentions-score-fit")

export const MIN_FIT_SCORE = 70
const BATCH_SIZE = 20
const SCORE_THINKING_BUDGET = 2000
const CONCURRENCY = 2
const RETRY_DELAYS_MS = [3_000, 10_000, 30_000]

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
  raw_text?: string | null
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

export async function scoreMentionFit(
  product: {
    product_name: string
    product_description: string
    website_url: string
  },
  mentions: MentionInput[]
): Promise<{ results: MentionFitResult[]; totalCost: number }> {
  if (mentions.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(mentions, BATCH_SIZE)
  const limit = pLimit(CONCURRENCY)

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
  product: {
    product_name: string
    product_description: string
    website_url: string
  },
  mentions: MentionInput[]
): Promise<{ results: MentionFitResult[]; cost: number }> {
  const payload = mentions.map((m) => ({
    id: m.id,
    topic_summary: m.topic_summary ?? "(no summary)",
    publication_domain: m.publication_domain ?? "(unknown)",
    raw_text: m.raw_text ?? "(none)",
  }))

  const systemInstructions = `You are evaluating journalist inbound requests (HARO-style) to decide if the product's founder or team would be a genuinely relevant, credible expert source for the journalist's story.

Product: ${product.product_name}
Description: ${product.product_description}

Each item is a journalist or publication publicly requesting sources, quotes, case studies, or product recommendations for a specific story. Score how well this product fits as a source for THAT story.

The key question is: "Would a journalist writing this story plausibly want to quote this product's founder or feature this product?" — not "could this product help someone in the story."

Scoring guide (fit_score 1-100):
- 90-100: Story is squarely about what this product does (e.g. link building, community monitoring, PR outreach, founder growth tools, SEO automation). The journalist is asking for exactly this kind of expertise or product example.
- 70-89: Story covers digital marketing, startup growth, content strategy, or B2B SaaS — topics where this product is a credible, on-topic example or expert source.
- 50-69: Loose match; story touches the product's world but the connection requires stretching.
- <50: Different domain — score low even if the product could theoretically "help" someone in the story. This includes: fashion/beauty/lifestyle, travel, health/wellness, personal stories, physical products, finance, legal, food, or any B2C consumer topic.

Hard rules:
- Do NOT score ≥70 just because the product "could help brands find this opportunity" or "could help someone respond." That is never sufficient.
- Do NOT score ≥70 for requests seeking physical products, lifestyle brands, personal anecdotes, or experts in unrelated professional domains (medicine, law, engineering, etc.).
- Do NOT score ≥70 for requests where the audience is consumers, not founders or marketing teams.

Return ALL mentions with their scores and a one-sentence reason.`

  const requestOptions = {
    model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
    fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
    systemInstructions,
    thinkingBudget: SCORE_THINKING_BUDGET,
    input: `Mentions:\n${JSON.stringify(payload, null, 2)}`,
    responseFormat: {
      type: "json_schema" as const,
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
  }

  let lastErr: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { text, cost } = await generateTextWithUsage(requestOptions)

      let parsed: { results: { id: string; fit_score: number; reason: string }[] }
      try {
        parsed = JSON.parse(text) as typeof parsed
      } catch (parseErr) {
        log.warn("score batch json parse failed", { error: String(parseErr) })
        return { results: [], cost }
      }

      const scored: MentionFitResult[] = parsed.results.map((r) => ({
        mentionId: r.id,
        fitScore: Math.round(r.fit_score),
        reason: r.reason,
      }))

      return { results: scored, cost }
    } catch (err) {
      lastErr = err
      const msg = String(err)
      const isRateLimit = msg.includes("rate_limit_exceeded") || msg.includes('"code":429') || msg.includes("429")
      if (isRateLimit && attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt]!
        log.warn("score batch rate limited, retrying", { attempt: attempt + 1, delay_ms: delay })
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  log.warn("score batch failed", { error: String(lastErr) })
  return { results: [], cost: 0 }
}
