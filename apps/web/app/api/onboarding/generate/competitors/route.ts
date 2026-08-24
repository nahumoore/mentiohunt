import { normalizeCompetitorUrl, normalizeUrl } from "@/consts/onboarding"
import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { extractHostname, validateDomains } from "@/lib/onboarding/validate-domain"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const competitorsSchema = z.object({
  competitors: z.array(z.string().min(3)).min(2).max(5),
})

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["competitors"],
  properties: {
    competitors: {
      type: "array",
      minItems: 2,
      maxItems: 5,
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
      name: "competitor_domains",
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
  "Given a product's name, description, and homepage signals, identify direct competitors whose backlink profiles are worth mining for outreach prospects.",
  "Return JSON only with this exact shape:",
  '{"competitors":["example.com"]}',
  "Rules:",
  "- competitors must contain 2 to 5 unique root domains of real products that serve the same audience and solve the same problem.",
  "- Match the input site's scale and niche. Exclude category-dominant marketplaces, directories, and aggregators (e.g. Angi, HomeAdvisor, Yelp, Thumbtack, Google, Amazon) even if they compete for the same customers — their backlinks are generic directory badges, not niche editorial mentions, so they make poor mining targets for a smaller site.",
  "- For a local or regional business, prefer other local/regional competitors or niche content sites in the same space over national platforms.",
  "- Return root domains only (e.g. 'example.com'), never full URLs, paths, or subpages.",
  "- Do not include 'https://', 'http://', 'www.', or any trailing slashes.",
  "- Do not include the input site itself.",
  "- If the homepage is ambiguous, infer the most plausible competitor set from the available signals.",
].join("\n")

function extractJsonObject(input: string): string {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i)
  if (fencedMatch?.[1]) return fencedMatch[1].trim()
  const first = input.indexOf("{")
  const last = input.lastIndexOf("}")
  if (first === -1 || last === -1 || last <= first) throw new Error("Model did not return JSON")
  return input.slice(first, last + 1)
}

/**
 * One retry only — onboarding is a synchronous wait for the user, not a
 * background job. Domains still invalid after this are dropped; the user
 * fills gaps in manually rather than the whole request failing.
 */
async function retryInvalidDomains({
  input,
  valid,
  invalid,
  websiteUrl,
}: {
  input: string
  valid: string[]
  invalid: string[]
  websiteUrl: string
}): Promise<string[]> {
  const retryInput = [
    input,
    "",
    "You previously suggested these root domains:",
    [...valid, ...invalid].map(extractHostname).join(", "),
    "",
    `These do not resolve to a real domain and must be replaced: ${invalid.map(extractHostname).join(", ")}.`,
    `Keep these unchanged, they're valid: ${valid.map(extractHostname).join(", ") || "(none)"}.`,
    "Replace only the invalid ones with different real competitor domains. Return the same JSON shape with 2 to 5 total unique root domains.",
  ].join("\n")

  try {
    const retryOutput = await generateText({ input: retryInput, systemInstructions, ...GENERATE_OPTIONS })
    const retryResult = competitorsSchema.safeParse(JSON.parse(extractJsonObject(retryOutput.text)))

    if (!retryResult.success) {
      return valid
    }

    const retryCompetitors = Array.from(
      new Set(
        retryResult.data.competitors
          .map((c) => normalizeCompetitorUrl(c))
          .filter((c) => c && extractHostname(c) !== extractHostname(websiteUrl))
      )
    ).slice(0, 5)

    const retryValidation = await validateDomains(retryCompetitors)

    return Array.from(new Set([...valid, ...retryValidation.valid])).slice(0, 5)
  } catch {
    return valid
  }
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
    const result = competitorsSchema.safeParse(JSON.parse(extractJsonObject(output.text)))

    if (!result.success) {
      return NextResponse.json({ error: "Failed to generate competitors." }, { status: 502 })
    }

    const ownHostname = extractHostname(normalizeUrl(parsed.data.websiteUrl))
    const invalidCandidates: string[] = []
    const firstPass = Array.from(
      new Set(
        result.data.competitors.flatMap((candidate) => {
          const normalized = normalizeCompetitorUrl(candidate)
          if (!normalized || extractHostname(normalized) === ownHostname) {
            invalidCandidates.push(candidate)
            return []
          }
          return [normalized]
        })
      )
    ).slice(0, 5)

    const { valid, invalid } = await validateDomains(firstPass)

    let competitors = valid

    if (invalid.length > 0 || invalidCandidates.length > 0) {
      competitors = await retryInvalidDomains({
        input,
        valid,
        invalid: [...invalidCandidates, ...invalid],
        websiteUrl: parsed.data.websiteUrl,
      })
    }

    if (competitors.length === 0) {
      return NextResponse.json({ error: "Failed to generate competitors." }, { status: 502 })
    }

    return NextResponse.json({ competitors })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate competitors."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
