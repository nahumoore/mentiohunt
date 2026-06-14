import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import type { GatheredPost } from "./gather-posts.js"

const log = createLogger("reply-queue-analyze")

const MIN_FIT_SCORE = 70
const ANALYZE_THINKING_BUDGET = 4000

export type FitCategory =
  | "seeking_recommendation"
  | "comparing_alternatives"
  | "expressing_pain"
  | "asking_how"
  | "switching_tools"
  | "general_mention"

export interface AnalyzedPost extends GatheredPost {
  fit_category: FitCategory
  fit_score: number
  summary: string
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  return words.length <= maxWords
    ? text
    : words.slice(0, maxWords).join(" ") + "…"
}

export async function analyzePosts(
  posts: GatheredPost[],
  product: { product_name: string; product_description: string },
  keywords: string[]
): Promise<{ posts: AnalyzedPost[]; totalCost: number }> {
  if (posts.length === 0) return { posts: [], totalCost: 0 }

  const batches = chunk(posts, 20)
  const limit = pLimit(20)

  const results = await Promise.all(
    batches.map((batch) => limit(() => analyzeBatch(batch, product, keywords)))
  )

  const allPosts = results.flatMap((r) => r.posts)
  const totalCost = results.reduce((sum, r) => sum + r.cost, 0)

  log.info("analyze result", {
    passed: allPosts.length,
    posts: allPosts.map((p) => ({
      title: p.title ?? truncateWords(p.body, 10),
      platform: p.platform,
      community: p.community,
      fit_score: p.fit_score,
      fit_category: p.fit_category,
      summary: p.summary,
    })),
  })

  return { posts: allPosts, totalCost }
}

async function analyzeBatch(
  posts: GatheredPost[],
  product: { product_name: string; product_description: string },
  keywords: string[]
): Promise<{ posts: AnalyzedPost[]; cost: number }> {
  const payload = posts.map((p) => ({
    id: p.post_id,
    platform: p.platform,
    community: p.community ?? undefined,
    title: p.title ?? undefined,
    body: truncateWords(p.body, 150),
  }))

  const systemInstructions = `You are a strict lead scoring assistant for a social media monitoring tool.

Product: ${product.product_name}
Description: ${product.product_description}
Search keywords used to find these posts: ${keywords.join(", ")}

These posts were gathered by searching social media for those keywords. A keyword match alone does NOT raise the score — penalize posts where the keyword appears coincidentally in an unrelated domain (health, academic research, politics, finance, local news).

First, infer from the product description:
- Who the target user is (role, professional context, what they're trying to accomplish)
- What specific problems this product solves for them

Then score each post:
- fit_score: 1-100
  - 90-100: author is clearly target user type AND directly seeking or describing the exact problem this product solves
  - 70-89: author is plausibly target user type AND discussing a genuine related need, even if not yet seeking a solution
  - 50-69: discussing the problem space but author doesn't match target user profile, or connection is indirect
  - <50: no genuine match — downgrade here if the only connection is coincidental word overlap (e.g. post is about trading, healthcare, civic organizing, academic research, entertainment — but happens to use words like "insights", "community", "research")
- fit_category: one of seeking_recommendation, comparing_alternatives, expressing_pain, asking_how, switching_tools, general_mention
- summary: 1-2 sentence neutral description of the author's actual need

Return ALL posts with their scores. Be precise — a score of 72 must reflect genuine target user fit, not keyword coincidence.`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
      fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
      systemInstructions,
      thinkingBudget: ANALYZE_THINKING_BUDGET,
      timeoutMs: 90_000,
      input: `Posts:\n${JSON.stringify(payload, null, 2)}`,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "post_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              posts: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    id: { type: "string" },
                    fit_score: { type: "number" },
                    fit_category: {
                      type: "string",
                      enum: [
                        "seeking_recommendation",
                        "comparing_alternatives",
                        "expressing_pain",
                        "asking_how",
                        "switching_tools",
                        "general_mention",
                      ],
                    },
                    summary: { type: "string" },
                  },
                  required: ["id", "fit_score", "fit_category", "summary"],
                  additionalProperties: false,
                },
              },
            },
            required: ["posts"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as {
      posts: {
        id: string
        fit_score: number
        fit_category: FitCategory
        summary: string
      }[]
    }

    const postById = new Map(posts.map((p) => [p.post_id, p]))
    const analyzed: AnalyzedPost[] = []

    for (const item of parsed.posts) {
      const post = postById.get(item.id)
      if (!post || item.fit_score < MIN_FIT_SCORE) continue
      analyzed.push({
        ...post,
        fit_category: item.fit_category,
        fit_score: Math.round(item.fit_score),
        summary: item.summary,
      })
    }

    return { posts: analyzed, cost }
  } catch (err) {
    log.warn("analyze batch failed", { error: String(err) })
    return { posts: [], cost: 0 }
  }
}
