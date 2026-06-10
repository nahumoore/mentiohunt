import { normalizeUrl } from "@/consts/onboarding"
import { generateText } from "@workspace/openrouter/generate-text"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const competitorsSchema = z.object({
  competitors: z.array(z.string().min(3)).min(8).max(10),
})

const requestSchema = z.object({
  site: z.record(z.unknown()),
  websiteUrl: z.string().url(),
  productName: z.string().trim().default(""),
  productDescription: z.string().trim().default(""),
})

const systemInstructions = [
  "Given a product's name, description, and homepage signals, identify real products that compete directly with it.",
  "Return JSON only with this exact shape:",
  '{"competitors":["example.com"]}',
  "Rules:",
  "- competitors must contain 8 to 10 unique root domains of real products that serve the same audience and solve the same problem.",
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
    const output = await generateText({ input, systemInstructions })
    const result = competitorsSchema.safeParse(JSON.parse(extractJsonObject(output)))

    if (!result.success) {
      return NextResponse.json({ error: "Failed to generate competitors." }, { status: 502 })
    }

    const competitors = Array.from(
      new Set(
        result.data.competitors
          .map((c) => normalizeUrl(c))
          .filter((c) => c !== parsed.data.websiteUrl)
      )
    ).slice(0, 10)

    if (competitors.length < 8) {
      return NextResponse.json({ error: "Failed to generate enough competitors." }, { status: 502 })
    }

    return NextResponse.json({ competitors })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate competitors."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
