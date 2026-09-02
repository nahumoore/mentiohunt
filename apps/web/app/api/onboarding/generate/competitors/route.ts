import { normalizeCompetitorUrl, normalizeUrl } from "@/consts/onboarding"
import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { extractHostname, validateDomains } from "@/lib/onboarding/validate-domain"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"
// The generation call plus a possible retry can run ~30s each; the platform
// default (10-15s) was silently killing the request before the model replied.
export const maxDuration = 60

// How many competitors we ask the model for. The client step schema accepts up
// to 10; DNS validation and dedupe below can shave a couple off, so the user
// typically lands on ~8-10 and tops up the rest by hand.
const TARGET_COMPETITORS = 10

// Lenient on count — if a provider under-delivers we return what we got rather
// than 502 the whole request. The JSON schema below is what pushes for 10.
const competitorsSchema = z.object({
  competitors: z.array(z.string().min(3)).min(2).max(TARGET_COMPETITORS),
})

const RESPONSE_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["competitors"],
  properties: {
    competitors: {
      type: "array",
      minItems: TARGET_COMPETITORS,
      maxItems: TARGET_COMPETITORS,
      items: {
        type: "string",
      },
    },
  },
} as const

const GENERATE_OPTIONS: Pick<
  Parameters<typeof generateText>[0],
  "model" | "fallbackModels" | "reasoningEnabled" | "timeoutMs" | "responseFormat"
> = {
  model: OPENROUTER_MODELS.DEEPSEEK_DEEPSEEK_V4_PRO,
  fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH, OPENROUTER_MODELS.OPENAI_GPT_5_6_LUNA],
  // Picking competitor domains is simple extraction — the model's reasoning
  // phase adds ~15s here for no quality gain, so switch it off.
  reasoningEnabled: false,
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
  `- competitors must contain exactly ${TARGET_COMPETITORS} unique root domains of real products that serve the same audience and solve the same problem. If fewer than ${TARGET_COMPETITORS} direct competitors exist, fill the remaining slots with the closest adjacent tools in the same space — but never invent a domain you are not confident is real.`,
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
 * background job. Runs when the first pass came back with unresolvable domains
 * or simply short of TARGET_COMPETITORS; it asks the model to keep the good
 * ones and fill the list back up to the target. Anything still missing after
 * this is left for the user to add by hand.
 */
async function topUpCompetitors({
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
    `Keep these unchanged, they're valid: ${valid.map(extractHostname).join(", ") || "(none)"}.`,
    invalid.length > 0
      ? `These do not resolve to a real domain — drop them and do not suggest them again: ${invalid.map(extractHostname).join(", ")}.`
      : "",
    `Return the same JSON shape with ${TARGET_COMPETITORS} total unique root domains: the valid ones above plus enough additional real competitor domains to reach ${TARGET_COMPETITORS}. Never invent a domain you are not confident is real.`,
  ]
    .filter(Boolean)
    .join("\n")

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
    ).slice(0, TARGET_COMPETITORS)

    const retryValidation = await validateDomains(retryCompetitors)

    return Array.from(new Set([...valid, ...retryValidation.valid])).slice(0, TARGET_COMPETITORS)
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
    ).slice(0, TARGET_COMPETITORS)

    const { valid, invalid } = await validateDomains(firstPass)

    let competitors = valid

    if (invalid.length > 0 || invalidCandidates.length > 0 || valid.length < TARGET_COMPETITORS) {
      competitors = await topUpCompetitors({
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
