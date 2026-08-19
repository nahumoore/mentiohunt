import { normalizeKeyword } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const MAX_TARGET_KEYWORDS = 10

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const keywordSchema = z
  .string()
  .min(1)
  .transform(normalizeKeyword)
  .pipe(z.string().min(2, "Keywords must be at least 2 characters.").max(60, "Keep each keyword under 60 characters."))

async function loadProduct(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string
) {
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, target_keywords")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (productError) {
    console.error("Error fetching keywords product:", productError)
    return { error: buildError("Failed to update target keywords.", 500) }
  }

  if (!product) {
    return { error: buildError("Product not found.", 404) }
  }

  return { product }
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = z.object({ keyword: keywordSchema }).safeParse(body)

  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { product, error } = await loadProduct(supabase, user.id)
  if (error) return error

  const keywords = product.target_keywords ?? []
  const keyword = parsed.data.keyword

  if (keywords.some((existing: string) => existing.toLowerCase() === keyword.toLowerCase())) {
    return buildError("Already added.", 409)
  }

  if (keywords.length >= MAX_TARGET_KEYWORDS) {
    return buildError(`You can track up to ${MAX_TARGET_KEYWORDS} target keywords.`, 403)
  }

  const nextKeywords = [...keywords, keyword]

  const { error: updateError } = await supabase
    .from("products")
    .update({ target_keywords: nextKeywords })
    .eq("id", product.id)

  if (updateError) {
    console.error("Error adding target keyword:", updateError)
    return buildError("Failed to add keyword.", 500)
  }

  return NextResponse.json({ keywords: nextKeywords }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = z.object({ keyword: z.string().min(1) }).safeParse(body)

  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { product, error } = await loadProduct(supabase, user.id)
  if (error) return error

  const keywords = product.target_keywords ?? []
  const nextKeywords = keywords.filter((existing: string) => existing !== parsed.data.keyword)

  const { error: updateError } = await supabase
    .from("products")
    .update({ target_keywords: nextKeywords })
    .eq("id", product.id)

  if (updateError) {
    console.error("Error removing target keyword:", updateError)
    return buildError("Failed to remove keyword.", 500)
  }

  return NextResponse.json({ keywords: nextKeywords })
}
