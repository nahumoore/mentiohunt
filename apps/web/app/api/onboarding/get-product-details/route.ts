import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"
import { supabaseServer } from "@/lib/supabase/server"
import { generateText } from "@workspace/openrouter/generate-text"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const requestSchema = z.object({
  websiteUrl: z
    .string()
    .trim()
    .min(1, "Website URL is required.")
    .transform(normalizeUrl)
    .pipe(z.string().url("Enter a valid website URL.")),
})

const generatedDetailsSchema = z.object({
  productDescription: z
    .string()
    .trim()
    .min(24)
    .max(280),
  competitors: z.array(z.string().url()).min(8).max(10),
})

function buildPrompt(site: Awaited<ReturnType<typeof fetchSiteDetails>>) {
  return [
    "You are helping populate onboarding data for a backlink prospecting product called Mentiohunt.",
    "Analyze the homepage signals and infer what the company sells, who it helps, and which companies are realistic competitors.",
    "Return JSON only with this exact shape:",
    '{"productDescription":"string","competitors":["https://example.com"]}',
    "Rules:",
    "- productDescription must be concrete, plain English, and between 24 and 280 characters.",
    "- Focus on the product, target user, and outcome. Avoid hype and avoid first person voice.",
    "- competitors must contain 8 to 10 unique homepage URLs for real competing products or close alternatives.",
    "- Use absolute HTTPS URLs only.",
    "- Do not include the input site itself.",
    "- If the homepage is ambiguous, still produce the best plausible competitor list from the available signals.",
    "Homepage signals:",
    JSON.stringify(site, null, 2),
  ].join("\n")
}

function extractJsonObject(input: string) {
  const fencedMatch = input.match(/```(?:json)?\s*([\s\S]*?)```/i)

  if (fencedMatch?.[1]) {
    return fencedMatch[1].trim()
  }

  const firstBrace = input.indexOf("{")
  const lastBrace = input.lastIndexOf("}")

  if (firstBrace === -1 || lastBrace === -1 || lastBrace <= firstBrace) {
    throw new Error("Model did not return JSON")
  }

  return input.slice(firstBrace, lastBrace + 1)
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const { data: claimsData, error: authError } = await supabase.auth.getClaims()

  if (authError || !claimsData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsedRequest = requestSchema.safeParse(body)

  if (!parsedRequest.success) {
    return NextResponse.json(
      {
        error:
          parsedRequest.error.issues[0]?.message ?? "Invalid request payload.",
      },
      { status: 400 }
    )
  }

  try {
    const site = await fetchSiteDetails(parsedRequest.data.websiteUrl)
    const modelOutput = await generateText({ input: buildPrompt(site) })
    const json = extractJsonObject(modelOutput)
    const parsedGenerated = generatedDetailsSchema.safeParse(JSON.parse(json))

    if (!parsedGenerated.success) {
      console.error("Invalid onboarding generation output:", parsedGenerated.error)

      return NextResponse.json(
        { error: "Failed to generate onboarding details." },
        { status: 502 }
      )
    }

    const competitors = Array.from(
      new Set(
        parsedGenerated.data.competitors
          .map((competitor) => normalizeUrl(competitor))
          .filter((competitor) => competitor !== parsedRequest.data.websiteUrl)
      )
    ).slice(0, 10)

    if (competitors.length < 8) {
      return NextResponse.json(
        { error: "Failed to generate enough competitors." },
        { status: 502 }
      )
    }

    return NextResponse.json({
      websiteUrl: parsedRequest.data.websiteUrl,
      productDescription: parsedGenerated.data.productDescription.trim(),
      competitors,
      homepage: site,
    })
  } catch (error) {
    console.error("Error generating onboarding product details:", error)

    const message =
      error instanceof Error ? error.message : "Failed to process website."

    return NextResponse.json({ error: message }, { status: 500 })
  }
}
