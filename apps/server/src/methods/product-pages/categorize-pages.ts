import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { withLlmRetries, LLM_RETRY_DELAYS_MS } from "../../helpers/llm-retry.js"
import { parseLlmJson } from "../../helpers/parse-llm-json.js"
import { heuristicPageCategories } from "./heuristic-page-category.js"

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
  relevanceScore: number
  matchedKeywords: string[]
  reason: string
}

export type PageToClassify = {
  url: string
  title: string
  description: string
  text: string
}

// Was 15. Combined with `reasoningEnabled: false` below, a 6-page batch fits
// comfortably inside its per-batch timeout instead of routinely exceeding it
// on every model in the fallback chain (see the 2026-09-02 preview-speed
// ticket: a single stuck 15-page batch cost ~700s across three attempts).
const BATCH_SIZE = 6

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

const SYSTEM_INSTRUCTIONS = (
  product: { product_name: string; product_description: string },
  targetKeywords: string[]
) =>
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
${
  targetKeywords.length > 0
    ? `
4. Score 0-100 how well this page serves as a backlink destination for these target keywords, listed most important first (priority 1 is the site's top keyword, and each one below it matters progressively less):
${targetKeywords.map((k, i) => `   ${i + 1}. ${k}`).join("\n")}
   - relevanceScore: 0-100, how strongly the page's actual content matches the intent behind these keywords (not just superficial word overlap). Weight this toward the higher-priority keywords — a strong match on keyword 1 should score well above an equally strong match on keyword 5.
   - matchedKeywords: which of the target keywords this page genuinely serves, copied verbatim from the list above — do NOT include the leading number, only the keyword text itself.
   - reason: one short sentence explaining the score.
   If none of the target keywords fit this page, return relevanceScore: 0, matchedKeywords: [], and a reason saying so.`
    : `
4. Set relevanceScore to 0, matchedKeywords to an empty array, and reason to an empty string — no target keywords were provided.`
}

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
              relevanceScore: { type: "number" },
              matchedKeywords: { type: "array", items: { type: "string" } },
              reason: { type: "string" },
            },
            required: ["id", "pageType", "keywords", "priority", "relevanceScore", "matchedKeywords", "reason"],
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
  product: { product_name: string; product_description: string },
  targetKeywords: string[] = [],
  options: { retryDelaysMs?: number[] } = {}
): Promise<{ results: PageCategorization[]; totalCost: number }> {
  if (pages.length === 0) return { results: [], totalCost: 0 }

  const retryDelaysMs = options.retryDelaysMs ?? LLM_RETRY_DELAYS_MS
  const batches = chunk(pages, BATCH_SIZE)
  const limit = pLimit(5)

  // A single stuck batch must never take the rest down with it — this run
  // must never stall the whole preview/onboarding pass over one bad batch.
  const settlements = await Promise.allSettled(
    batches.map((batch) => limit(() => categorizeBatch(batch, product, targetKeywords, retryDelaysMs)))
  )

  const batchResults = settlements.map((settlement) => {
    if (settlement.status === "fulfilled") return settlement.value
    // categorizeBatch already swallows its own failures into
    // { results: [], cost: 0 } — a rejection here would mean something
    // outside that try/catch threw, which shouldn't happen, but fail open
    // the same way rather than losing the whole batch.
    log.warn("batch categorization rejected unexpectedly", {
      error: String(settlement.reason),
    })
    return { results: [] as PageCategorization[], cost: 0 }
  })

  const categorizedByUrl = new Map(
    batchResults.flatMap((r) => r.results).map((r) => [r.url, r])
  )
  const totalCost = batchResults.reduce((sum, r) => sum + r.cost, 0)

  // Fail open: any page a batch couldn't categorize (total model-chain
  // failure, or a shape mismatch) still gets a heuristic guess rather than
  // vanishing — a preview must never stall or silently drop pages because
  // one classification batch is slow.
  const uncategorized = pages.filter((p) => !categorizedByUrl.has(p.url))
  if (uncategorized.length > 0) {
    log.warn("falling back to heuristic categorization", {
      total: pages.length,
      uncategorized: uncategorized.length,
    })
    for (const heuristic of heuristicPageCategories(uncategorized, targetKeywords)) {
      categorizedByUrl.set(heuristic.url, heuristic)
    }
  }

  const results = pages
    .map((p) => categorizedByUrl.get(p.url))
    .filter((r): r is PageCategorization => r !== undefined)

  log.info("categorization complete", {
    total: pages.length,
    categorized: results.length,
    heuristicFallbacks: uncategorized.length,
    cost_usd: totalCost.toFixed(4),
  })

  return { results, totalCost }
}

async function categorizeBatch(
  pages: PageToClassify[],
  product: { product_name: string; product_description: string },
  targetKeywords: string[],
  retryDelaysMs: number[]
): Promise<{ results: PageCategorization[]; cost: number }> {
  // matchedKeywords is persisted verbatim and shown in the UI, so guard
  // against the model echoing back the "N. " ranking prefix we prompt it
  // with — only keep entries that map back to an actual target keyword,
  // restored to its canonical casing.
  const targetKeywordByLower = new Map(targetKeywords.map((k) => [k.toLowerCase(), k]))
  function sanitizeMatchedKeyword(raw: string): string | null {
    const stripped = raw.replace(/^\s*\d+[.)]\s*/, "").trim()
    return targetKeywordByLower.get(stripped.toLowerCase()) ?? null
  }

  const payload = pages.map((p) => {
    const hasMetadata = Boolean(p.title || p.description)
    return {
      id: p.url,
      title: p.title || "(no title)",
      description: p.description || "",
      ...(!hasMetadata && p.text ? { text: p.text } : {}),
    }
  })

  // Flat 60s default timeout (see generateTextWithUsage) starves larger
  // batches — a 15-page batch generates enough output + reasoning tokens to
  // routinely exceed it, so it fails on every model on every retry and the
  // whole batch is silently dropped (see crawlProductPages' EMPTY_RESULT
  // path). Scale headroom with batch size so bigger batches aren't
  // structurally doomed.
  const timeoutMs = 60_000 + pages.length * 4_000

  try {
    return await withLlmRetries(
      log,
      async () => {
        const input = `Pages:\n${JSON.stringify(payload, null, 2)}`
        const systemInstructions = SYSTEM_INSTRUCTIONS(product, targetKeywords)
        log.info("llm request", {
          model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
          fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO],
          systemInstructions,
          thinkingBudget: 1000,
          reasoningEnabled: false,
          timeoutMs,
          input,
        })
        const { text, cost, modelUsed } = await generateTextWithUsage({
          model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
          fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO],
          systemInstructions,
          thinkingBudget: 1000,
          // Page categorization is pure classification, not judgment — the
          // reasoning phase buys nothing here but costs most of the latency.
          // Docs on this option report deepseek-v4-pro dropping from ~17s to
          // ~2s on classification prompts with no meaningful quality loss.
          reasoningEnabled: false,
          timeoutMs,
          input,
          responseFormat: RESPONSE_FORMAT,
        })

        const parsed = parseLlmJson<{
          results: {
            id: string
            pageType: string
            keywords: string[]
            priority: string
            relevanceScore: number
            matchedKeywords: string[]
            reason: string
          }[]
        }>(text)

        if (!Array.isArray(parsed?.results)) {
          log.warn("unexpected response shape", { rawResponse: text })
          throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
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
              relevanceScore: r.relevanceScore ?? 0,
              matchedKeywords: (r.matchedKeywords ?? [])
                .map(sanitizeMatchedKeyword)
                .filter((k): k is string => k !== null),
              reason: r.reason ?? "",
            }
          })
          .filter((r): r is PageCategorization => r !== null)

        if (categorized.length < pages.length) {
          log.warn("id mismatch: some pages uncategorized", {
            sentIds: pages.map((p) => p.url),
            returnedIds: parsed.results.map((r) => r.id),
            missingIds: pages.filter((p) => !byId.has(p.url)).map((p) => p.url),
            rawResponse: text,
          })
        }

        log.info("batch categorized", { model: modelUsed, pages: categorized.length })

        for (const r of categorized) {
          log.info("categorized page", {
            url: r.url,
            pageType: r.pageType,
            priority: r.priority,
            relevanceScore: r.relevanceScore,
            keywords: r.keywords.slice(0, 3),
          })
        }

        return { results: categorized, cost }
      },
      retryDelaysMs
    )
  } catch (err) {
    log.warn("batch categorization failed", { error: String(err) })
    return { results: [], cost: 0 }
  }
}
