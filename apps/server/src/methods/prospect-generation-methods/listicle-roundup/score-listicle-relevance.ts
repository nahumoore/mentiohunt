import pLimit from "p-limit"
import { generateTextWithUsage, LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"

const log = createLogger("score-listicle-relevance")

export type ListicleCandidate = {
  url: string
  title: string
  text: string
}

export type ScoredListicle = ListicleCandidate & {
  relevanceScore: number
  relevanceReason: string
  topCompetitor: string | null
}

const BATCH_SIZE = 10
const TEXT_EXCERPT_LENGTH = 2000

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

// Emitted only when the product has target_keywords — most don't yet (see the
// 2026-08-21 target-keywords-in-discovery ticket), and an unconditional block
// would change scoring for every product that has never set one.
function keywordAnchor(targetKeywords?: string[] | null): string {
  const keywords = (targetKeywords ?? []).filter(Boolean)
  if (keywords.length === 0) return ""
  return `\nThis product's confirmed target keywords, most important first (priority 1 is the top keyword, and each one below it matters progressively less): weight fit toward the higher-priority ones.\n${keywords.map((k, i) => `${i + 1}. ${k}`).join("\n")}`
}

const SYSTEM_INSTRUCTIONS = (product: {
  product_name: string
  product_description: string
  competitors?: string[] | null
  target_keywords?: string[] | null
}) =>
  `You are evaluating web pages as potential "add my product to your list" outreach targets. Each page is a candidate roundup/listicle article ("best X tools", "top N alternatives", etc).

Product: ${product.product_name}
Description: ${product.product_description}
${product.competitors?.length ? `Known competitors: ${product.competitors.join(", ")}` : ""}${keywordAnchor(product.target_keywords)}

Score whether this page is a genuine, updatable listicle of tools in this product's exact category, where THIS product is not already listed, and adding it would be a natural fit.

Score guide (1-5):
- 5: Clear "best/top X tools" roundup in the exact category, product absent, inclusion is a natural fit
- 4: Roundup in an adjacent but closely related category, product absent
- 3: Listicle format but category fit is loose, or unclear if maintained/updated
- 2: Weak — thin listicle, wrong category, or looks abandoned/outdated, OR the page is published by a competing product's own site (a company blog promoting its own tool, that only names well-known/established competitors) — these sites have no editorial reason to add an unfamiliar, smaller competitor, even when the listicle itself looks genuine
- 1: Not a listicle (single review, news article, aggregator page) OR the product is already listed

If a well-known competitor is featured on the page, name it as topCompetitor (empty string if none identifiable).

Return ALL items with their scores, one-line reason, and topCompetitor.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "listicle_relevance_scores",
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
              topCompetitor: { type: "string" },
            },
            required: ["id", "score", "reason", "topCompetitor"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

export async function scoreListicleRelevance(
  items: ListicleCandidate[],
  product: {
    product_name: string
    product_description: string
    competitors?: string[] | null
    target_keywords?: string[] | null
  }
): Promise<{ results: ScoredListicle[]; totalCost: number }> {
  if (items.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(5)

  const settlements = await Promise.allSettled(
    batches.map((batch) => limit(() => scoreBatch(batch, product)))
  )
  const batchResults = settlements.map((s) => {
    if (s.status === "fulfilled") return s.value
    log.warn("batch failed after full model-chain outage, skipping batch", { error: String(s.reason) })
    return { results: [], cost: 0 }
  })

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
  items: ListicleCandidate[],
  product: {
    product_name: string
    product_description: string
    competitors?: string[] | null
    target_keywords?: string[] | null
  }
): Promise<{ results: ScoredListicle[]; cost: number }> {
  const payload = items.map((item) => ({
    id: item.url,
    title: item.title || "(no title)",
    excerpt: (item.text || "(no content)").slice(0, TEXT_EXCERPT_LENGTH),
  }))

  try {
    return await withLlmRetries(log, async () => {
      const input = `Pages:\n${JSON.stringify(payload, null, 2)}`
      log.info("llm request", {
        model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
        fallbackModels: [OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
        fallbackModels: [OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      type ScoreEntry = { id: string; score: number; reason: string; topCompetitor: string }
      const parsed = parseLlmJson<{ results: ScoreEntry[] } | ScoreEntry[]>(text)
      // Some models return a bare array instead of the requested {results:[...]}
      // wrapper despite strict:true — accept both shapes rather than dropping
      // the whole batch on a technicality.
      const results = Array.isArray(parsed) ? parsed : parsed?.results

      if (!Array.isArray(results)) {
        throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
      }

      const scoreById = new Map(results.map((r) => [r.id, r]))

      const scored: ScoredListicle[] = items
        .map((item) => {
          const s = scoreById.get(item.url)
          if (!s) return null
          return {
            ...item,
            relevanceScore: Math.round(s.score),
            relevanceReason: s.reason,
            topCompetitor: s.topCompetitor?.trim() || null,
          }
        })
        .filter((r): r is ScoredListicle => r !== null)

      if (scored.length < items.length) {
        log.warn("id mismatch: some items unscored", {
          sentIds: items.map((i) => i.url),
          returnedIds: results.map((r) => r.id),
          missingIds: items.filter((i) => !scoreById.has(i.url)).map((i) => i.url),
          rawResponse: text,
        })
      }

      log.info("batch scored", { model: modelUsed, items: scored.length })

      for (const r of scored) {
        log.info("scored item", {
          url: r.url,
          title: r.title || "(no title)",
          score: r.relevanceScore,
          passed: r.relevanceScore >= 3,
          reason: r.relevanceReason,
          topCompetitor: r.topCompetitor,
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
