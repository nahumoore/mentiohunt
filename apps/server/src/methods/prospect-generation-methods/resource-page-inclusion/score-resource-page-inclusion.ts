import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"

const log = createLogger("score-resource-page-inclusion")

export type TargetPageForInclusion = {
  id: string
  url: string
  title: string | null
  description: string | null
  page_type: string
  priority: number
  keywords: string[]
}

export type ResourceInclusionCandidate = {
  id: string
  url: string
  domain: string
  title: string
  snippet: string
  text: string
  query: string
  targetPage: TargetPageForInclusion
}

export type ScoredResourceInclusionCandidate = ResourceInclusionCandidate & {
  relevanceScore: number
  relevanceReason: string
  isCuratedResourcePage: boolean
  alreadyLinksToTarget: boolean
}

const RETRY_DELAYS_MS = [3_000, 10_000, 30_000]
const BATCH_SIZE = 5
const TEXT_EXCERPT_LENGTH = 2200

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const SYSTEM_INSTRUCTIONS = (product: { product_name: string; product_description: string }) =>
  `You are evaluating external web pages as outreach targets for adding one specific user-owned page as a useful resource.

Product: ${product.product_name}
Description: ${product.product_description}

For each candidate, decide whether the external page is a good "resource page inclusion" prospect for the provided target page.

A good prospect:
- Curates, recommends, references, or links out to useful resources/tools/guides/templates/checklists on the target topic.
- Has a clear topical match with the target page.
- Does not already appear to include or link to the target page/product.
- Would make a natural, non-spammy outreach ask: "would you consider adding this resource for readers?"

Score guide (1-5):
- 5: Clear curated resource/tool/template/guide page in the exact topic; target page is a strong missing fit.
- 4: Strong topical fit and likely open to external resources, but not a perfect curated page.
- 3: Some topical fit, but inclusion ask is plausible only with a loose angle.
- 2: Weak fit, mostly an article/news/company page, or hard to justify adding a link.
- 1: Wrong topic, own/product/social/aggregator/noise page, or already includes the target.

Return ALL items. Be strict about alreadyLinksToTarget when the candidate appears to mention the exact product, URL, or target page title.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "resource_page_inclusion_scores",
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
              isCuratedResourcePage: { type: "boolean" },
              alreadyLinksToTarget: { type: "boolean" },
            },
            required: ["id", "score", "reason", "isCuratedResourcePage", "alreadyLinksToTarget"],
            additionalProperties: false,
          },
        },
      },
      required: ["results"],
      additionalProperties: false,
    },
  },
}

export async function scoreResourcePageInclusion(
  items: ResourceInclusionCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: ScoredResourceInclusionCandidate[]; totalCost: number }> {
  if (items.length === 0) return { results: [], totalCost: 0 }

  const batches = chunk(items, BATCH_SIZE)
  const limit = pLimit(4)
  const batchResults = await Promise.all(
    batches.map((batch) => limit(() => scoreBatch(batch, product)))
  )

  const results = batchResults.flatMap((r) => r.results)
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  log.info("scoring complete", {
    total: items.length,
    scored: results.length,
    passing: results.filter((r) => r.relevanceScore >= 3 && !r.alreadyLinksToTarget).length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function scoreBatch(
  items: ResourceInclusionCandidate[],
  product: { product_name: string; product_description: string }
): Promise<{ results: ScoredResourceInclusionCandidate[]; cost: number }> {
  const payload = items.map((item) => ({
    id: item.id,
    candidateUrl: item.url,
    candidateTitle: item.title || "(no title)",
    candidateSnippet: item.snippet || "",
    candidateExcerpt: (item.text || "(no content)").slice(0, TEXT_EXCERPT_LENGTH),
    targetPage: {
      url: item.targetPage.url,
      title: item.targetPage.title || "(no title)",
      description: item.targetPage.description || "",
      pageType: item.targetPage.page_type,
      priority: item.targetPage.priority,
      keywords: item.targetPage.keywords.slice(0, 8),
    },
  }))

  let lastErr: unknown
  for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
    try {
      const { text, cost } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: [OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        thinkingBudget: 2000,
        input: `Candidates:\n${JSON.stringify(payload, null, 2)}`,
        responseFormat: RESPONSE_FORMAT,
      })

      let parsed: {
        results: {
          id: string
          score: number
          reason: string
          isCuratedResourcePage: boolean
          alreadyLinksToTarget: boolean
        }[]
      }
      try {
        parsed = parseLlmJson<typeof parsed>(text)
      } catch (parseErr) {
        log.warn("json parse failed", { error: String(parseErr), rawResponse: text })
        return { results: [], cost: 0 }
      }

      const scoreById = new Map(parsed.results.map((r) => [r.id, r]))
      const scored: ScoredResourceInclusionCandidate[] = items
        .map((item) => {
          const s = scoreById.get(item.id)
          if (!s) return null
          return {
            ...item,
            relevanceScore: Math.round(s.score),
            relevanceReason: s.reason,
            isCuratedResourcePage: s.isCuratedResourcePage,
            alreadyLinksToTarget: s.alreadyLinksToTarget,
          }
        })
        .filter((r): r is ScoredResourceInclusionCandidate => r !== null)

      for (const r of scored) {
        log.info("scored item", {
          url: r.url,
          targetUrl: r.targetPage.url,
          score: r.relevanceScore,
          isCuratedResourcePage: r.isCuratedResourcePage,
          alreadyLinksToTarget: r.alreadyLinksToTarget,
          reason: r.relevanceReason,
        })
      }

      return { results: scored, cost }
    } catch (err) {
      lastErr = err
      const msg = String(err)
      const isRateLimit = msg.includes("rate_limit_exceeded") || msg.includes('"code":429') || msg.includes("429")
      const isEmptyCompletion = msg.includes("did not include text content")
      if ((isRateLimit || isEmptyCompletion) && attempt < RETRY_DELAYS_MS.length) {
        const delay = RETRY_DELAYS_MS[attempt]!
        log.warn(isEmptyCompletion ? "empty completion, retrying" : "rate limited, retrying", {
          attempt: attempt + 1,
          delay_ms: delay,
        })
        await new Promise((resolve) => setTimeout(resolve, delay))
        continue
      }
      break
    }
  }

  log.warn("scoring failed", { error: String(lastErr) })
  return { results: [], cost: 0 }
}
