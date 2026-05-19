import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import type { GatheredPost } from "./gather-posts.js"

const log = createLogger("reply-queue-filter")

const FILTER_THINKING_BUDGET = 4000

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ") + "…"
}

export async function filterPosts(
  posts: GatheredPost[],
  product: { product_name: string; product_description: string },
  keywords: string[]
): Promise<{ posts: GatheredPost[]; totalCost: number }> {
  if (posts.length === 0) return { posts: [], totalCost: 0 }

  const batches = chunk(posts, 25)
  const relevantIds = new Set<string>()
  let totalCost = 0

  await Promise.all(
    batches.map(async (batch) => {
      try {
        const { ids, cost } = await filterBatch(batch, product, keywords)
        for (const id of ids) relevantIds.add(id)
        totalCost += cost
      } catch (err) {
        log.warn("filter batch failed, passing all through", { error: String(err) })
        for (const p of batch) relevantIds.add(p.post_id)
      }
    })
  )

  const kept = posts.filter((p) => relevantIds.has(p.post_id))
  const dropped = posts.filter((p) => !relevantIds.has(p.post_id))

  log.info("filter result", {
    kept: kept.length,
    dropped: dropped.length,
    keptTitles: kept.map((p) => p.title ?? truncateWords(p.body, 10)),
    droppedTitles: dropped.map((p) => p.title ?? truncateWords(p.body, 10)),
  })

  return { posts: kept, totalCost }
}

async function filterBatch(
  posts: GatheredPost[],
  product: { product_name: string; product_description: string },
  keywords: string[]
): Promise<{ ids: string[]; cost: number }> {
  const payload = posts.map((p) => ({
    id: p.post_id,
    platform: p.platform,
    community: p.community ?? undefined,
    title: p.title ?? undefined,
    body: truncateWords(p.body, 150),
  }))

  const systemInstructions = `You are a strict relevance filter for a social media monitoring tool.

Product: ${product.product_name}
Description: ${product.product_description}
Search keywords used to find these posts: ${keywords.join(", ")}

These posts were gathered by searching social media for those keywords. A keyword match alone is NOT enough — the match must reflect genuine intent relevant to the product. Many posts will contain these keywords coincidentally (e.g. "community" in a civic context, "research" in an academic context, "insights" in a financial report).

First, infer from the product description:
- Who the target user is (role, context, what they're trying to accomplish)
- What problems or needs this product addresses

Then evaluate each post against that. Include a post ONLY if ALL of these are true:
1. The author is plausibly the target user type, or is in a professional/business context where this product would apply
2. The post discusses a genuine problem, question, or need that this product directly addresses
3. The keyword match reflects real intent — not coincidental word usage (e.g. "listening" in a music context, "community" in a civic/nonprofit context, "research" in an academic/medical context)

Exclude a post if ANY of these are true:
- The topic is clearly outside the product's problem space (entertainment, politics, personal life, unrelated academic work)
- The keyword appears by accident — the post is about something entirely different
- The connection to what this product does requires more than one logical leap

When in doubt, exclude. Return only IDs of posts that are a clear fit.`

  const { text, cost } = await generateTextWithUsage({
    model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
    systemInstructions,
    thinkingBudget: FILTER_THINKING_BUDGET,
    input: `Posts:\n${JSON.stringify(payload, null, 2)}`,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "relevant_post_ids",
        strict: true,
        schema: {
          type: "object",
          properties: {
            relevant_ids: { type: "array", items: { type: "string" } },
          },
          required: ["relevant_ids"],
          additionalProperties: false,
        },
      },
    },
  })

  const parsed = JSON.parse(text) as { relevant_ids: string[] }
  return { ids: parsed.relevant_ids, cost }
}
