import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { withLlmRetries } from "../../helpers/llm-retry.js"
import { parseLlmJson } from "../../helpers/parse-llm-json.js"

const log = createLogger("derive-product-profile")

const FALLBACK_MODELS = [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO]

// Below this much combined signal text, there isn't enough for an LLM to
// describe the product honestly — skip the call entirely rather than pay for
// a guess dressed up as a description.
const MIN_SIGNAL_CHARS = 120

export type ProductProfile = {
  productName: string
  productDescription: string
  confidence: "high" | "low"
}

export type SiteProfileInput = {
  url: string
  title?: string | null
  metaDescription?: string | null
  h1?: string[]
  paragraphs?: string[]
}

const SYSTEM_INSTRUCTIONS = `You summarize what a website's product does from its homepage content, for use in backlink-outreach relevance scoring.

Rules:
- Write exactly one sentence describing what the product does and who it is for (its target audience/market).
- Do not just restate the title or tagline — describe the actual product/service.
- Use plain, specific language ("a CRM for real estate agents"), not marketing fluff.
- Report your confidence honestly: "low" if the provided content is too thin, generic, or ambiguous to describe the product with any real specificity — do not guess or invent a plausible-sounding product category when the signal isn't there.`

const RESPONSE_FORMAT = {
  type: "json_schema" as const,
  json_schema: {
    name: "product_profile",
    strict: true,
    schema: {
      type: "object",
      properties: {
        description: { type: "string" },
        confidence: { type: "string", enum: ["high", "low"] },
      },
      required: ["description", "confidence"],
      additionalProperties: false,
    },
  },
}

function hostnameOf(url: string): string {
  try {
    return new URL(url.startsWith("http") ? url : `https://${url}`).hostname.replace(/^www\./i, "")
  } catch {
    return url
  }
}

function signalText(input: SiteProfileInput): string {
  return [input.metaDescription ?? "", ...(input.h1 ?? []), ...(input.paragraphs ?? [])]
    .join(" ")
    .trim()
}

function buildInput(input: SiteProfileInput): string {
  const lines = [`Product name / title: ${input.title || hostnameOf(input.url)}`]
  if (input.metaDescription) lines.push(`Meta description: ${input.metaDescription}`)
  if (input.h1?.length) lines.push(`Headings: ${input.h1.slice(0, 3).join(" | ")}`)
  if (input.paragraphs?.length) {
    lines.push(`Page content: ${input.paragraphs.slice(0, 3).join(" ").slice(0, 800)}`)
  }
  return lines.join("\n")
}

function fallbackProfile(input: SiteProfileInput): ProductProfile {
  const name = input.title?.trim() || hostnameOf(input.url)
  return { productName: name, productDescription: name, confidence: "low" }
}

/**
 * Derives a real, LLM-summarized one-sentence product description instead of
 * relying on a raw <title> tag (often a tagline or bare brand word for small
 * sites) — used as both the niche seed and the relevance-scoring
 * product_description in the two free backlink tools. Never throws.
 */
export async function deriveProductProfile(
  input: SiteProfileInput
): Promise<{ profile: ProductProfile; cost: number }> {
  const productName = input.title?.trim() || hostnameOf(input.url)
  const signal = signalText(input)

  if (signal.length < MIN_SIGNAL_CHARS) {
    log.warn("insufficient signal for product profile, skipping llm", {
      url: input.url,
      signalChars: signal.length,
    })
    return { profile: fallbackProfile(input), cost: 0 }
  }

  try {
    const { description, confidence, cost } = await withLlmRetries(log, async () => {
      const text = buildInput(input)
      log.info("llm request", { model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH, input: text })

      const { text: raw, cost: callCost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.Z_AI_GLM_4_7_FLASH,
        fallbackModels: FALLBACK_MODELS,
        systemInstructions: SYSTEM_INSTRUCTIONS,
        input: text,
        responseFormat: RESPONSE_FORMAT,
      })

      const parsed = parseLlmJson<{ description?: unknown; confidence?: unknown }>(raw)
      const description = typeof parsed.description === "string" ? parsed.description.trim() : ""
      const confidence: "high" | "low" = parsed.confidence === "high" ? "high" : "low"

      if (!description) throw new Error("empty description in response")

      log.info("product profile derived", { model: modelUsed, description, confidence })

      return { description, confidence, cost: callCost }
    })

    return {
      profile: { productName, productDescription: description, confidence },
      cost,
    }
  } catch (err) {
    log.warn("product profile derivation failed, falling back", { url: input.url, error: String(err) })
    return { profile: fallbackProfile(input), cost: 0 }
  }
}
