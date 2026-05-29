import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import {
  CORE_JOURNALIST_HASHTAGS,
  PRIMARY_JOURNALIST_HASHTAG,
} from "./discovery-terms.js"

const log = createLogger("build-search-queries")

export async function buildSearchQueries(product: {
  product_name: string
  product_description: string
  website_url: string
  competitors: string[]
}): Promise<string[]> {
  const competitorsList =
    product.competitors.length > 0 ? product.competitors.join(", ") : "none"

  const systemInstructions = `You extract short topic keyword phrases for a product so they can be combined with journalist request hashtags.

Product: ${product.product_name}
Description: ${product.product_description}
Competitors: ${competitorsList}

Return 4-5 short keyword phrases (1-3 words each) that describe:
- The industry or niche this product serves
- The core problem it solves
- The audience type (e.g. "startup founders", "small marketing teams")
- Related use-cases journalists might write about

Rules:
- Do NOT include the product name or competitor names
- Do NOT include hashtags — return raw keyword phrases only
- Focus on what a journalist covering this space would search for or write about
- Phrases should be natural English, not SEO jargon`

  const coreHashtags = [...CORE_JOURNALIST_HASHTAGS]

  try {
    const { text } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
      systemInstructions,
      input: "Extract the topic keyword phrases.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "topic_keywords",
          strict: true,
          schema: {
            type: "object",
            properties: {
              topics: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["topics"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as { topics: string[] }
    const topics = parsed.topics.filter((t) => t.trim().length > 0).slice(0, 5)

    if (topics.length === 0) {
      log.warn("LLM returned no topics, using core hashtags only")
      return coreHashtags
    }

    const topicQueries = topics.map(
      (topic) => `${PRIMARY_JOURNALIST_HASHTAG} ${topic}`
    )
    const queries = [...coreHashtags, ...topicQueries]

    log.info("search queries built", {
      core_hashtags: coreHashtags.length,
      topic_queries: topicQueries.length,
      total: queries.length,
      topics,
    })

    return queries
  } catch (err) {
    log.warn("topic extraction failed, using core hashtags only", {
      error: String(err),
    })
    return coreHashtags
  }
}
