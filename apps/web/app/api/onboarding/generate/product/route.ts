import { generateText } from "@workspace/openrouter/generate-text"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const productInfoSchema = z.object({
  productName: z.string().trim().min(1).max(80),
  productDescription: z.string().trim().min(24).max(280),
})

const systemInstructions = [
  "Extract the product name and a concise description from the homepage signals provided.",
  "Return JSON only with this exact shape:",
  '{"productName":"string","productDescription":"string"}',
  "Rules:",
  "- productName must be the product/company name from the site, not the legal entity suffix.",
  "- productDescription must be concrete, plain English, and between 24 and 280 characters.",
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
    const output = await generateText({ input, systemInstructions })
    const parsed = productInfoSchema.safeParse(JSON.parse(extractJsonObject(output.text)))

    if (!parsed.success) {
      return NextResponse.json({ error: "Failed to generate product info." }, { status: 502 })
    }

    return NextResponse.json({
      productName: parsed.data.productName.trim(),
      productDescription: parsed.data.productDescription.trim(),
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to generate product info."
    return NextResponse.json({ error: message }, { status: 502 })
  }
}
