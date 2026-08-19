import { normalizeKeyword } from "@/consts/onboarding"
import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const keywordsSchema = z.object({
  keywords: z.array(z.string().min(2)).min(8).max(10),
})

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["keywords"],
  properties: {
    keywords: {
      type: "array",
      minItems: 8,
      maxItems: 10,
      items: {
        type: "string",
      },
    },
  },
} as const

const GENERATE_OPTIONS: Pick<
  Parameters<typeof generateText>[0],
  "model" | "fallbackModels" | "timeoutMs" | "responseFormat"
> = {
  model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
  fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
  timeoutMs: 30_000,
  responseFormat: {
    type: "json_schema",
    json_schema: {
      name: "target_keywords",
      strict: true,
      schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
    },
  },
}

const requestSchema = z.object({
  site: z.record(z.unknown()),
  websiteUrl: z.string().url(),
  productName: z.string().trim().default(""),
  productDescription: z.string().trim().default(""),
})

const systemInstructions = [
  "Given a product's name, description, and homepage signals, identify the search keywords this site should be earning backlinks for.",
  "Return JSON only with this exact shape:",
  '{"keywords":["backlink outreach software"]}',
  "Rules:",
  "- keywords must contain 8 to 10 unique search phrases, 1 to 5 words each, lowercase, no punctuation.",
  "- Prefer commercial or informational intent terms a real buyer would search — not brand names, not the company's own name (unless the brand name is also the category), not questions, not full sentences.",
  "- Each keyword must plausibly map to a real page this site could publish or already has (a product, feature, guide, or comparison topic) — these keywords are used to pick which of the site's existing pages to promote for backlinks.",
  "- Prefer specific phrases over generic ones (e.g. 'saas link building outreach' over 'marketing').",
  "- If the homepage is ambiguous, infer the most plausible keyword set from the available signals.",
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
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request payload." }, { status: 400 })
  }

  try {
    const input = [
      `Website: ${parsed.data.websiteUrl}`,
      parsed.data.productName && `Product name: ${parsed.data.productName}`,
      parsed.data.productDescription && `Product description: ${parsed.data.productDescription}`,
      "Homepage signals:",
      JSON.stringify(parsed.data.site, null, 2),
    ]
      .filter(Boolean)
      .join("\n")
    const output = await generateText({ input, systemInstructions, ...GENERATE_OPTIONS })
    const result = keywordsSchema.safeParse(JSON.parse(extractJsonObject(output.text)))

    if (!result.success) {
      return NextResponse.json({ error: "Failed to generate keywords." }, { status: 502 })
    }

    let hostname = ""
    try {
      hostname = new URL(parsed.data.websiteUrl).hostname.replace(/^www\./, "")
    } catch {
      // ignore
    }

    const keywords = Array.from(
      new Set(
        result.data.keywords
          .map(normalizeKeyword)
          .filter((k) => k.length > 0 && k.split(" ").length <= 6)
          .filter((k) => !hostname || !k.includes(hostname))
      )
    ).slice(0, 10)

    if (keywords.length === 0) {
      return NextResponse.json({ error: "Failed to generate keywords." }, { status: 502 })
    }

    return NextResponse.json({ keywords })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate keywords."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
