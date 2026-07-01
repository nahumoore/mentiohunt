import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { parseLlmJson } from "../../helpers/parse-llm-json.js"

const log = createLogger("categorize-pages")

export type ProductPageType =
  | "article"
  | "resource"
  | "free_tool"
  | "landing_page"
  | "case_study"
  | "comparison"

export type PagePriority = "high" | "medium" | "low"

export type PageCategorization = {
  url: string
  pageType: ProductPageType
  keywords: string[]
  priority: PagePriority
}

export type PageToClassify = {
  url: string
  title: string
  description: string
  text: string
}

const RETRY_DELAYS_MS = [3_000, 10_000, 30_000]
const BATCH_SIZE = 15

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const SYSTEM_INSTRUCTIONS = (product: { product_name: string; product_description: string }) =>
  `You are classifying pages on a B2B SaaS product website to help prioritize them for backlink outreach.

Product: ${product.product_name}
Description: ${product.product_description}

For each page provided:
1. Assign a pageType:
   - "article": blog post, opinion piece, tutorial, how-to guide, news
   - "resource": glossary, template, checklist, framework, reference material
   - "free_tool": interactive calculator, analyzer, generator, checker
   - "landing_page": homepage, feature page, pricing page, about page, use-case page
   - "case_study": customer story, success story, results showcase
   - "comparison": vs page, alternative page, comparison article

2. Extract 5–10 target keywords — the specific topics this page is about (e.g., "link building", "B2B SaaS SEO", "backlink audit"). Focus on what a searcher would query to find this page.

3. Assign priority for backlink outreach:
   - "high": article, resource, or comparison page — strong fit as a placement target
   - "medium": case_study or free_tool — moderate fit
   - "low": landing_page — hard to get a backlink placed here

Return ALL items. Use only the exact enum values listed above.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "page_categorizations",
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
              pageType: {
                type: "string",
                enum: ["article", "resource", "free_tool", "landing_page", "case_study", "comparison"],
              },
              keywords: { type: "array", items: { type: "string" } },
              priority: { type: "string", enum: ["high", "medium", "low"] },
            },
            required: ["id", "pageType", "keywords", "priority"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

export async function categorizePages(
  pages: PageToClassify[],
  product: { product_name: string; product_description: string }
): Promise<{ results: PageCategorization[]; totalCost: number }> {
  if (pages.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(pages, BATCH_SIZE)
  const limit = pLimit(5)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => categorizeBatch(batch, product)))
  )

  const results = batchResults.flatMap((r) => r.results)
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  log.info("categorization complete", {
    total: pages.length,
    categorized: results.length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function categorizeBatch(
  pages: PageToClassify[],
  product: { product_name: string; product_description: string }
): Promise<{ results: PageCategorization[]; cost: number }> {
  const payload = pages.map((p) => {
    const hasMetadata = Boolean(p.title || p.description)
    return {
      id: p.url,
      title: p.title || "(no title)",
      description: p.description || "",
      ...(!hasMetadata && p.text ? { text: p.text } : {}),
    }
  })

  let lastErr: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { text, cost } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 1000,
        input: `Pages:\n${JSON.stringify(payload, null, 2)}`,
        responseFormat: RESPONSE_FORMAT,
      })

      let parsed: { results: { id: string; pageType: string; keywords: string[]; priority: string }[] }
      try {
        parsed = parseLlmJson<typeof parsed>(text)
      } catch (parseErr) {
        log.warn("json parse failed", { error: String(parseErr), rawResponse: text })
        return { results: [], cost: 0 }
      }

      const byId = new Map(parsed.results.map((r) => [r.id, r]))

      const categorized: PageCategorization[] = pages
        .map((page) => {
          const r = byId.get(page.url)
          if (!r) return null
          return {
            url: page.url,
            pageType: r.pageType as ProductPageType,
            keywords: r.keywords,
            priority: r.priority as PagePriority,
          }
        })
        .filter((r): r is PageCategorization => r !== null)

      for (const r of categorized) {
        log.info("categorized page", {
          url: r.url,
          pageType: r.pageType,
          priority: r.priority,
          keywords: r.keywords.slice(0, 3),
        })
      }

      return { results: categorized, cost }
    } catch (err) {
      lastErr = err
      const msg = String(err)
      const isRateLimit = msg.includes("rate_limit_exceeded") || msg.includes('"code":429') || msg.includes("429")
      if (isRateLimit && attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt]!
        log.warn("rate limited, retrying", { attempt: attempt + 1, delay_ms: delay })
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  log.warn("batch categorization failed", { error: String(lastErr) })
  return { results: [], cost: 0 }
}
