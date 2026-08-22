import pLimit from "p-limit"
import { generateTextWithUsage, LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"
import type { TaggedBacklinkItem } from "./filter-backlinks.js"

const log = createLogger("score-backlink-relevance")

export type PageType = "roundup" | "comparison" | "resource" | "brand-mention" | "other"

export type ScoredBacklinkItem = TaggedBacklinkItem & {
  relevanceScore: number
  relevanceReason: string
  pageType: PageType
}

const BATCH_SIZE = 20

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function extractUrlPath(url: string): string {
  try {
    return new URL(url).pathname
  } catch {
    return url
  }
}

// Emitted only when the product has target_keywords — most don't yet (see the
// 2026-08-21 target-keywords-in-discovery ticket), and an unconditional block
// would change scoring for every product that has never set one.
function keywordAnchor(targetKeywords?: string[] | null): string {
  const keywords = (targetKeywords ?? []).filter(Boolean)
  if (keywords.length === 0) return ""
  return `\n\nThis product's confirmed target keywords, most important first (priority 1 is the top keyword, and each one below it matters progressively less): weight fit toward the higher-priority ones.\n${keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}`
}

const SYSTEM_INSTRUCTIONS = (product: {
  product_name: string
  product_description: string
  target_keywords?: string[] | null
}) =>
  `You are evaluating pages that link to a competitor product. Score how relevant each page is as a backlink outreach opportunity for this product.

Product: ${product.product_name}
Description: ${product.product_description}${keywordAnchor(product.target_keywords)}

Each item is a page that currently links to a competitor. Score whether this product could realistically be added to or featured on that page.

Score guide (1-5):
- 5: Perfect fit — roundup/comparison of tools in this exact category, or resource page for this product's audience
- 4: Strong fit — clearly relevant page, product could be added with minimal stretch
- 3: Moderate fit — some relevance but requires context; borderline inclusion
- 2: Weak fit — loose connection, product mention would feel forced; OR the page is published by a competing product's own site (a company blog promoting its own tool, that only names well-known/established competitors) — no editorial reason to add an unfamiliar, smaller competitor; OR the page's content is about a different language/locale/audience than this product's own (e.g. the page is about learning German when this product is for French learners) even if the linked competitor is the same
- 1: No fit — different domain entirely (lifestyle, physical products, unrelated B2C), OR the linking page is a forum thread, forum post, or auto-generated tool/app directory listing with no identifiable human editor to contact

Also classify the page type:
- "roundup": list of multiple tools/products (e.g., "11 best X tools")
- "comparison": head-to-head comparison page (e.g., "X vs Y")
- "resource": educational content, guides, how-tos that mention tools
- "brand-mention": single brand/product mention in an article
- "other": everything else

Return ALL items with their scores, reasons, and page types.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "backlink_relevance_scores",
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
              reason: { type: "string" },
              pageType: { type: "string", enum: ["roundup", "comparison", "resource", "brand-mention", "other"] },
            },
            required: ["id", "score", "reason", "pageType"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

export async function scoreBacklinkRelevance(
  items: TaggedBacklinkItem[],
  product: { product_name: string; product_description: string; target_keywords?: string[] | null }
): Promise<{ results: ScoredBacklinkItem[]; totalCost: number }> {
  if (items.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(5)

  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => scoreBatch(batch, product)))
  )

  const results = batchResults.flatMap((r) => r.results)
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  log.info("scoring complete", {
    total: items.length,
    scored: results.length,
    passing: results.filter((r) => r.relevanceScore >= 3).length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function scoreBatch(
  items: TaggedBacklinkItem[],
  product: { product_name: string; product_description: string; target_keywords?: string[] | null }
): Promise<{ results: ScoredBacklinkItem[]; cost: number }> {
  const payload = items.map((item) => {
    const entry: Record<string, string | number> = {
      id: item.urlFrom,
      title: item.title || "(no title)",
      anchor: item.anchor || "(no anchor)",
      urlTo_path: extractUrlPath(item.urlTo),
      competitor: item.competitorDomain,
    }
    if (item.textPre) entry["textPre"] = item.textPre
    if (item.textPost) entry["textPost"] = item.textPost
    return entry
  })

  try {
    return await withLlmRetries(log, async () => {
      const input = `Pages:\n${JSON.stringify(payload, null, 2)}`
      log.info("llm request", {
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = parseLlmJson<{ results: { id: string; score: number; reason: string; pageType: string }[] }>(text)

      if (!Array.isArray(parsed?.results)) {
        throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
      }

      const scoreById = new Map(parsed.results.map((r) => [r.id, r]))

      const scored: ScoredBacklinkItem[] = items
        .map((item) => {
          const s = scoreById.get(item.urlFrom)
          if (!s) return null
          return {
            ...item,
            relevanceScore: Math.round(s.score),
            relevanceReason: s.reason,
            pageType: s.pageType as PageType,
          }
        })
        .filter((r): r is ScoredBacklinkItem => r !== null)

      if (scored.length < items.length) {
        log.warn("id mismatch: some items unscored", {
          sentIds: items.map((i) => i.urlFrom),
          returnedIds: parsed.results.map((r) => r.id),
          missingIds: items.filter((i) => !scoreById.has(i.urlFrom)).map((i) => i.urlFrom),
          rawResponse: text,
        })
      }

      log.info("batch scored", { model: modelUsed, items: scored.length })

      for (const r of scored) {
        log.info("scored item", {
          urlFrom: r.urlFrom,
          title: r.title || "(no title)",
          score: r.relevanceScore,
          pageType: r.pageType,
          passed: r.relevanceScore >= 3,
          reason: r.relevanceReason,
          competitor: r.competitorDomain,
        })
      }

      return { results: scored, cost }
    })
  } catch (err) {
    if (err instanceof LlmAllModelsFailedError) throw err
    log.warn("scoring failed", { error: String(err) })
    return { results: [], cost: 0 }
  }
}
