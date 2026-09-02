import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"
// The generation call can run ~30s; the platform default (10-15s) was silently
// killing the request before the model replied.
export const maxDuration = 60

const MAX_DESCRIPTION_LENGTH = 280

// Lenient shape for the raw model output. The model regularly overshoots the
// length target by a few words; rather than 502 the whole request over that,
// the handler clamps the description down to MAX_DESCRIPTION_LENGTH below.
const modelOutputSchema = z.object({
  productName: z.string().trim().min(1).max(120),
  productDescription: z.string().trim().min(1),
})

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["productName", "productDescription"],
  properties: {
    productName: { type: "string" },
    productDescription: { type: "string", minLength: 24, maxLength: MAX_DESCRIPTION_LENGTH },
  },
} as const

/**
 * Trim to the last whole word that fits, so a clamp never ends mid-word. The
 * "…" it appends is counted against the limit, so the result is always
 * <= MAX_DESCRIPTION_LENGTH (the client step schema rejects anything over).
 */
function clampDescription(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length <= MAX_DESCRIPTION_LENGTH) return trimmed

  const hardCut = trimmed.slice(0, MAX_DESCRIPTION_LENGTH - 1)
  const lastSpace = hardCut.lastIndexOf(" ")
  const wordSafe = lastSpace > 40 ? hardCut.slice(0, lastSpace) : hardCut
  return `${wordSafe.replace(/[\s,;:—-]+$/, "")}…`
}

const GENERATE_OPTIONS: Pick<
  Parameters<typeof generateText>[0],
  "model" | "fallbackModels" | "reasoningEnabled" | "timeoutMs" | "responseFormat"
> = {
  model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
  fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
  // Pulling a name and one-line description out of homepage text needs no
  // reasoning phase — switching it off cuts ~15s off the call.
  reasoningEnabled: false,
  timeoutMs: 30_000,
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "product_info",
      strict: true,
      schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
    },
  },
}

const systemInstructions = [
  "Extract the product name and a concise description from the homepage signals provided.",
  "Return JSON only with this exact shape:",
  '{"productName":"string","productDescription":"string"}',
  "Rules:",
  "- productName must be the product/company name from the site, not the legal entity suffix.",
  "- productDescription must be concrete, plain English, and between 24 and 240 characters. Hard cap 240 — do not exceed it.",
  "- Focus on what the product does, who it is for, and the outcome it delivers. Avoid hype and avoid first person voice.",
].join("\n")

function extractJsonObject(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  const first = input.indexOf("{")
  const last = input.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) throw new Error("Model did not return JSON")
  return input.slice(first, last + 1)
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const { data: claimsData, error: authError } = await supabase.auth.getClaims()

  if (authError || !claimsData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)

  if (!body?.site || typeof body.site !== "object") {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
  }

  try {
    const input = ["Homepage signals:", JSON.stringify(body.site, null, 2)].join("\n")
    const output = await generateText({ input, systemInstructions, ...GENERATE_OPTIONS })
    const parsed = modelOutputSchema.safeParse(JSON.parse(extractJsonObject(output.text)))

    if (!parsed.success) {
      return NextResponse.json({ error: "Failed to generate product info." }, { status: 502 })
    }

    const productDescription = clampDescription(parsed.data.productDescription)

    if (productDescription.length < 24) {
      return NextResponse.json({ error: "Failed to generate product info." }, { status: 502 })
    }

    return NextResponse.json({
      productName: parsed.data.productName.trim().slice(0, 80),
      productDescription,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate product info."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
