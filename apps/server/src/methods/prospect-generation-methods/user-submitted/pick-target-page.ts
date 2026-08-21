import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { parseLlmJson } from "../../../helpers/parse-llm-json.js"
import type { TargetPageCandidate, TargetPageChoice } from "./types.js"

const log = createLogger("pick-target-page")

const TEXT_EXCERPT_LENGTH = 2200

const SYSTEM_INSTRUCTIONS = (product: { product_name: string; product_description: string }) =>
  `You are picking which ONE of this product's own pages best fits as a "further reading" suggestion inside an external article, for backlink outreach.

Product: ${product.product_name}
Description: ${product.product_description}

You will be given the external article (title + excerpt) and a list of candidate pages owned by the product. Pick the single candidate page that is the most natural, specific fit for that article's topic — the one a genuine reader of that article would actually want to click. Prefer specific, on-topic pages over the homepage or generic pages.

Return the id of the chosen page, a fit score (1-5, how strong the fit is), and a one-sentence reason a human could read on the opportunity's detail page to understand why this page was picked.

Score guide (1-5):
- 5: The candidate page is a close topical match for the article, a reader would genuinely want this link.
- 4: Strong overlap, clearly relevant to the article's subject.
- 3: Some overlap, a plausible but not obvious fit.
- 2: Weak overlap, tenuous connection.
- 1: No real fit among the candidates — pick the least-bad option and say so honestly in the reason.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "target_page_choice",
    strict: true,
    schema: {
      type: "object",
      properties: {
        target_page_id: { type: "string" },
        fit_score: { type: "number" },
        reason: { type: "string" },
      },
      required: ["target_page_id", "fit_score", "reason"],
      additionalProperties: false,
    },
  },
}

/**
 * Picks which of the user's own tracked pages best fits a submitted prospect
 * article, in a single LLM call (argmax over our pages, not a per-candidate
 * batch scorer like scoreResourcePageInclusion — that one grades the
 * *external* page instead of choosing among *our* pages).
 */
export async function pickTargetPageForUrl(
  article: { title: string; text: string },
  pages: TargetPageCandidate[],
  product: { product_name: string; product_description: string }
): Promise<TargetPageChoice | null> {
  if (pages.length === 0) return null

  // A single candidate needs no LLM call — nothing to choose between.
  if (pages.length === 1) {
    const page = pages[0]!
    return { page, score: 3, reason: "Your only tracked page, so it was picked automatically.", cost: 0 }
  }

  const candidatesPayload = pages.map((page) => ({
    id: page.id,
    url: page.url,
    title: page.title || "(no title)",
    description: page.description || "",
    pageType: page.page_type,
    keywords: page.keywords.slice(0, 8),
  }))

  const input = `Article:\n${JSON.stringify(
    { title: article.title || "(no title)", excerpt: (article.text || "(no content)").slice(0, TEXT_EXCERPT_LENGTH) },
    null,
    2
  )}\n\nCandidate pages:\n${JSON.stringify(candidatesPayload, null, 2)}`

  try {
    const choice = await withLlmRetries(log, async () => {
      log.info("llm request", {
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        input,
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
        systemInstructions: SYSTEM_INSTRUCTIONS(product),
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = parseLlmJson<{ target_page_id: string; fit_score: number; reason: string }>(text)
      const page = pages.find((p) => p.id === parsed.target_page_id)
      if (!page) {
        throw new Error(`LLM returned unknown target_page_id: ${parsed.target_page_id}`)
      }

      log.info("target page picked", {
        model: modelUsed,
        pageId: page.id,
        score: parsed.fit_score,
        cost_usd: cost.toFixed(4),
      })

      return { page, score: Math.round(parsed.fit_score), reason: parsed.reason, cost }
    })

    return choice
  } catch (err) {
    log.warn("target page pick failed, falling back to highest-priority page", { error: String(err) })
    const fallback = [...pages].sort((a, b) => a.priority - b.priority)[0]
    if (!fallback) return null
    return {
      page: fallback,
      score: 2,
      reason: "Picked automatically as your highest-priority tracked page after the AI pick failed.",
      cost: 0,
    }
  }
}
