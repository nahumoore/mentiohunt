import { generateText } from "@workspace/openrouter/generate-text"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const audienceSchema = z.object({
  monitoringKeywords: z
    .array(
      z.string().trim().min(3).max(80).refine(
        (kw) => { const words = kw.trim().split(/\s+/); return words.length >= 2 && words.length <= 3 },
        { message: "Keyword must be 2–3 words" }
      )
    )
    .min(4)
    .max(10),
  monitoringCommunities: z
    .array(
      z.object({
        platform: z.literal("reddit"),
        community: z.string().trim().min(1).max(80),
      })
    )
    .min(3)
    .max(10),
})

const systemInstructions = [
  "Given a product's name, description, and homepage signals, identify monitoring keywords and Reddit communities relevant to it.",
  "Return JSON only with this exact shape:",
  '{"monitoringKeywords":["keyword"],"monitoringCommunities":[{"platform":"reddit","community":"SaaS"}]}',
  "Rules:",
  "- monitoringKeywords must contain 4 to 10 short-tail phrases, each exactly 2 to 3 words long, that the product's target audience uses when asking for recommendations, alternatives, or help with the problem this product solves.",
  "- Prefer broad phrasing over specific product names so the phrases match more posts (e.g. 'backlink tool' not 'best backlink tool for SaaS').",
  "- Do not include brand names or competitor names in keywords.",
  "- monitoringCommunities must contain 8 to 10 real subreddit names without the r/ prefix.",
  "- Pick communities where the product's likely buyers or users actively discuss the problem this product solves.",
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

  const productName = typeof body.productName === "string" ? body.productName.trim() : ""
  const productDescription = typeof body.productDescription === "string" ? body.productDescription.trim() : ""

  try {
    const input = [
      productName && `Product name: ${productName}`,
      productDescription && `Product description: ${productDescription}`,
      "Homepage signals:",
      JSON.stringify(body.site, null, 2),
    ]
      .filter(Boolean)
      .join("\n")
    const output = await generateText({ input, systemInstructions })
    const result = audienceSchema.safeParse(JSON.parse(extractJsonObject(output)))

    if (!result.success) {
      return NextResponse.json({ error: "Failed to generate audience signals." }, { status: 502 })
    }

    const monitoringKeywords = Array.from(
      new Set(result.data.monitoringKeywords.map((k) => k.trim()).filter(Boolean))
    ).slice(0, 10)

    const monitoringCommunities = Array.from(
      new Map(
        result.data.monitoringCommunities
          .map((c) => ({
            platform: c.platform,
            community: c.community.trim().replace(/^\/?r\//i, "").replace(/^\/+/, "").trim(),
          }))
          .filter((c) => c.community)
          .map((c) => [c.community.toLowerCase(), c] as const)
      ).values()
    ).slice(0, 10)

    if (monitoringKeywords.length < 4 || monitoringCommunities.length < 3) {
      return NextResponse.json(
        { error: "Failed to generate enough community monitoring details." },
        { status: 502 }
      )
    }

    return NextResponse.json({ monitoringKeywords, monitoringCommunities })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate audience signals."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
