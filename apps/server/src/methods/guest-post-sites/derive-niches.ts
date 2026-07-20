import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { withLlmRetries } from "../../helpers/llm-retry.js"
import type { SiteContext } from "./types.js"
import { DEFAULT_LIMITS } from "./types.js"

const log = createLogger("guest-post-sites-derive-niches")

const FALLBACK_MODELS = [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO]

const SYSTEM_INSTRUCTIONS = `You extract topical niche phrases from a website's homepage content, for use as Google search seed terms to find guest-posting sites in the same space.

Rules:
- Return 1-2 short topical niche phrases (2-4 words each), e.g. "B2B SaaS marketing", "productivity software", "email deliverability".
- Describe the audience/topic space the site serves — not the brand name, not generic words like "software" or "tools" alone.
- Do not include the product's own brand name.
- If the content is too thin to tell, make a reasonable best guess from whatever is available.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "niche_phrases",
    strict: true,
    schema: {
      type: "object",
      properties: {
        niches: {
          type: "array",
          items: { type: "string" },
        },
      },
      required: ["niches"],
      additionalProperties: false,
    },
  },
}

function buildInput(productName: string, siteContext?: SiteContext): string {
  const lines = [`Product name: ${productName}`]

  if (siteContext?.metaDescription) lines.push(`Meta description: ${siteContext.metaDescription}`)
  if (siteContext?.h1?.length) lines.push(`Headings: ${siteContext.h1.slice(0, 3).join(" | ")}`)
  if (siteContext?.paragraphs?.length) {
    lines.push(`Page content: ${siteContext.paragraphs.slice(0, 3).join(" ").slice(0, 800)}`)
  }

  return lines.join("\n")
}

/** Best-effort fallback when the LLM call fails — just use the product name as-is. */
function fallbackNiches(productName: string): string[] {
  return [productName].filter(Boolean).slice(0, DEFAULT_LIMITS.maxNiches)
}

export async function deriveNiches(
  productName: string,
  siteContext?: SiteContext
): Promise<{ niches: string[]; cost: number }> {
  try {
    const { niches, cost } = await withLlmRetries(log, async () => {
      const input = buildInput(productName, siteContext)
      log.info("llm request", { model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH, input })

      const { text, cost: callCost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: FALLBACK_MODELS,
        systemInstructions: SYSTEM_INSTRUCTIONS,
        input,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = JSON.parse(text) as { niches?: unknown }
      if (!Array.isArray(parsed?.niches)) {
        throw new Error(`unexpected response shape: ${Object.keys(parsed ?? {}).join(",")}`)
      }

      const cleaned = parsed.niches
        .filter((n): n is string => typeof n === "string" && n.trim().length > 0)
        .map((n) => n.trim())
        .slice(0, DEFAULT_LIMITS.maxNiches)

      log.info("niches derived", { model: modelUsed, niches: cleaned })

      return { niches: cleaned, cost: callCost }
    })

    if (niches.length === 0) return { niches: fallbackNiches(productName), cost }
    return { niches, cost }
  } catch (err) {
    log.warn("niche derivation failed, falling back to product name", { error: String(err) })
    return { niches: fallbackNiches(productName), cost: 0 }
  }
}
