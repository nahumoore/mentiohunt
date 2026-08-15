import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"
import { extractCompetitorDomain } from "../competitor-backlink/extract-backlinks.js"

const log = createLogger("build-listicle-queries")

const MAX_CATEGORIES = 5
const FRESHNESS_WINDOW_DAYS = 90

const SYSTEM_INSTRUCTIONS = `You identify the product category terms people search for when looking for tools like this one — the phrases that would appear in a "best X tools" or "top X software" roundup article.

Rules:
- Return 3 to 5 short category phrases (2-4 words), e.g. "email warmup tool", "cold outreach software", "link building service".
- Use terms a buyer would type into Google, not marketing language from the product's own site.
- Do not include the product's own name or its competitors' names.
- Prefer specific niches over generic ones (e.g. "backlink outreach software" over "SaaS tools").`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "listicle_categories",
    strict: true,
    schema: {
      type: "object",
      properties: {
        categories: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["categories"],
      additionalProperties: false,
    },
  },
}

function formatDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

/**
 * Turns a competitor domain like "pitchbox.com" into a searchable brand name
 * like "Pitchbox" — listicle posts write the brand name, not the bare FQDN.
 */
function brandNameFromDomain(domain: string): string {
  return domain
    .replace(/\.[a-z]+$/i, "")
    .split(/[-.]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ")
}

/**
 * Derive the full pool of "best X tools" / "<competitor> alternatives" search
 * queries for the listicle & roundup discovery method. One cheap LLM call
 * turns the product description into category phrases; those combine with
 * stored competitors and a rolling freshness window into the candidate query
 * pool. The caller (discoverListicleRoundups) rotates through this pool
 * day-to-day rather than running every query every run, so a fixed daily
 * subset doesn't keep re-scanning the same evergreen top-20 results.
 */
export async function buildListicleQueries(product: {
  product_name: string
  product_description: string
  website_url: string
  competitors?: string[] | null
}): Promise<{ queries: string[]; cost: number }> {
  const ownDomain = extractCompetitorDomain(product.website_url)

  let categories: string[] = []
  let cost = 0
  let modelUsed: string | null = null

  try {
    const { cost: callCost, modelUsed: usedModel, categories: parsedCategories } = await withLlmRetries(log, async () => {
      const input = `Product: ${product.product_name}\nDescription: ${product.product_description}`
      log.info("llm request", {
        model: OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH,
        fallbackModels: [OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO],
        systemInstructions: SYSTEM_INSTRUCTIONS,
        thinkingBudget: 1000,
        input,
      })
      const { text, cost: attemptCost, modelUsed: attemptModel } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH,
        fallbackModels: [OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO],
        systemInstructions: SYSTEM_INSTRUCTIONS,
        thinkingBudget: 1000,
        input,
        responseFormat: RESPONSE_FORMAT,
      })
      const parsed = parseLlmJson<{ categories?: unknown }>(text)
      return { cost: attemptCost, modelUsed: attemptModel, categories: parsed.categories }
    })
    cost = callCost
    modelUsed = usedModel
    categories = Array.isArray(parsedCategories)
      ? parsedCategories
          .filter((c): c is string => typeof c === "string" && c.trim().length > 0)
          .slice(0, MAX_CATEGORIES)
      : []
  } catch (err) {
    log.warn("category generation failed", { productName: product.product_name, error: String(err) })
  }

  const afterDate = formatDate(new Date(Date.now() - FRESHNESS_WINDOW_DAYS * 24 * 60 * 60 * 1000))

  const queries = new Set<string>()
  for (const category of categories) {
    const clean = category.trim()
    queries.add(`best ${clean} -site:${ownDomain}`)
    queries.add(`top ${clean} -site:${ownDomain}`)
    // Freshness variant — chases newly published/updated listicles specifically,
    // instead of only the same evergreen page that has ranked #1 for months.
    queries.add(`best ${clean} after:${afterDate} -site:${ownDomain}`)
  }

  for (const competitor of product.competitors ?? []) {
    const domain = extractCompetitorDomain(competitor)
    if (!domain || domain === ownDomain) continue
    const brandName = brandNameFromDomain(domain)
    queries.add(`"${brandName}" alternatives -site:${ownDomain}`)
  }

  const finalQueries = [...queries]

  log.info("query pool built", {
    categories,
    competitorCount: product.competitors?.length ?? 0,
    poolSize: finalQueries.length,
    model: modelUsed,
  })

  return { queries: finalQueries, cost }
}
