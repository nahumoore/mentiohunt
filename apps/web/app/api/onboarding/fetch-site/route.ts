import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"
import { supabaseServer } from "@/lib/supabase/server"
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

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const { data: claimsData, error: authError } = await supabase.auth.getClaims()

  if (authError || !claimsData) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = requestSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request payload." },
      { status: 400 }
    )
  }

  try {
    const site = await fetchSiteDetails(parsed.data.websiteUrl)
    return NextResponse.json({ websiteUrl: parsed.data.websiteUrl, site })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to process website."
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
