import pLimit from "p-limit"
import { generateTextWithUsage, LlmAllModelsFailedError } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"
import type { DeadLinkCandidate, ReplacementPageCandidate } from "./types.js"

const log = createLogger("match-replacement-page")

const BATCH_SIZE = 15
const NO_MATCH = "none"

export type ReplacementMatch = {
  targetPageId: string | null
  reason: string
}

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

const SYSTEM_INSTRUCTIONS = (
  product: { product_name: string; product_description: string },
  pages: ReplacementPageCandidate[]
) => `You are picking a replacement page for dead (404/gone) links found on other websites, for backlink outreach.

Product: ${product.product_name}
Description: ${product.product_description}

Each item is a dead link found on someone else's page: the dead URL's path, the anchor text that pointed at it, and surrounding text context. Pick the single best-fitting page from the candidate list below to suggest as a replacement reference — one a reader following that original link would genuinely find useful in its place.

Only pick a page if it is a real topical fit for the anchor text and surrounding context. A wrong replacement suggestion is worse than none — if nothing fits well, return "${NO_MATCH}" and say why in the reason.

Candidate pages (pick by id), each with a priority the site owner ranked it at — 1 is their most important page, 5 their least. When two candidates fit equally well, prefer the one with the lower (higher-priority) number:
${JSON.stringify(
  pages.map((p) => ({
    id: p.id,
    title: p.title || "(no title)",
    description: p.description || "",
    pageType: p.page_type,
    priority: p.priority,
    keywords: p.keywords.slice(0, 8),
  })),
  null,
  2
)}

Return ALL items with their chosen target_page_id ("${NO_MATCH}" if nothing fits) and a one-sentence reason.`

const RESPONSE_FORMAT = (pageIds: string[]) => ({
  type: "json_schema" as const,
  json_schema: {
    name: "replacement_page_matches",
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
              target_page_id: { type: "string", enum: [...pageIds, NO_MATCH] },
              reason: { type: "string" },
            },
            required: ["id", "target_page_id", "reason"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
})

export async function matchReplacementPages(
  items: DeadLinkCandidate[],
  pages: ReplacementPageCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, ReplacementMatch>; totalCost: number }> {
  if (items.length === 0 || pages.length === 0) return { results: new Map(), totalCost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(5)

  const batchResults = await Promise.all(batches.map((batch) => limit(() => matchBatch(batch, pages, product))))

  const results = new Map<string, ReplacementMatch>()
  let totalCost = 0
  for (const r of batchResults) {
    for (const [id, match] of r.results) results.set(id, match)
    totalCost += r.cost
  }

  log.info("matching complete", {
    total: items.length,
    matched: [...results.values()].filter((r) => r.targetPageId !== null).length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function matchBatch(
  items: DeadLinkCandidate[],
  pages: ReplacementPageCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: Map<string, ReplacementMatch>; cost: number }> {
  const pageIds = pages.map((p) => p.id)
  const payload = items.map((item) => {
    const entry: Record<string, string> = {
      id: item.urlFrom,
      deadUrlPath: extractUrlPath(item.deadUrl),
      anchor: item.anchor || "(no anchor)",
    }
    if (item.textPre) entry["textPre"] = item.textPre
    if (item.textPost) entry["textPost"] = item.textPost
    return entry
  })

  try {
    return await withLlmRetries(log, async () => {
      const input = `Dead links:\n${JSON.stringify(payload, null, 2)}`
      const systemInstructions = SYSTEM_INSTRUCTIONS(product, pages)
      log.info("llm request", {
        model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
        fallbackModels: [OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions,
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
        fallbackModels: [OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
        systemInstructions,
        input,
        responseFormat: RESPONSE_FORMAT(pageIds),
      })

      const parsed = parseLlmJson<{ results: { id: string; target_page_id: string; reason: string }[] }>(text)
      const byId = new Map(parsed.results.map((r) => [r.id, r]))

      const results = new Map<string, ReplacementMatch>()
      for (const item of items) {
        const r = byId.get(item.urlFrom)
        if (!r) continue
        results.set(item.urlFrom, {
          targetPageId: r.target_page_id === NO_MATCH ? null : r.target_page_id,
          reason: r.reason,
        })
      }

      log.info("batch matched", { model: modelUsed, items: results.size })

      return { results, cost }
    })
  } catch (err) {
    if (err instanceof LlmAllModelsFailedError) throw err
    log.warn("matching failed", { error: String(err) })
    return { results: new Map(), cost: 0 }
  }
}
