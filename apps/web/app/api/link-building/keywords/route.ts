import { MAX_TARGET_KEYWORDS, MIN_TARGET_KEYWORDS, normalizeKeyword } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const keywordSchema = z
  .string()
  .min(1)
  .transform(normalizeKeyword)
  .pipe(z.string().min(2, "Keywords must be at least 2 characters.").max(60, "Keep each keyword under 60 characters."))

const reorderSchema = z.object({
  keywords: z
    .array(keywordSchema)
    .min(MIN_TARGET_KEYWORDS, `Keep at least ${MIN_TARGET_KEYWORDS} target keywords.`)
    .max(MAX_TARGET_KEYWORDS, `You can rank up to ${MAX_TARGET_KEYWORDS} target keywords.`)
    .refine((keywords) => new Set(keywords).size === keywords.length, {
      message: "Each keyword should be unique.",
    }),
})

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
    return buildError(`You can rank up to ${MAX_TARGET_KEYWORDS} target keywords.`, 403)
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

export async function PUT(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = reorderSchema.safeParse(body)

  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { product, error } = await loadProduct(supabase, user.id)
  if (error) return error

  const current = product.target_keywords ?? []
  const nextKeywords = parsed.data.keywords

  // PUT reorders the existing set — it does not add or remove keywords.
  const currentSet = new Set<string>(current.map((k: string) => k.toLowerCase()))
  const nextSet = new Set<string>(nextKeywords.map((k: string) => k.toLowerCase()))
  const sameSet =
    currentSet.size === nextSet.size &&
    Array.from(currentSet).every((k: string) => nextSet.has(k))

  if (!sameSet) {
    return buildError("Reordering can't add or remove keywords.")
  }

  const { error: updateError } = await supabase
    .from("products")
    .update({ target_keywords: nextKeywords })
    .eq("id", product.id)

  if (updateError) {
    console.error("Error reordering target keywords:", updateError)
    return buildError("Failed to reorder keywords.", 500)
  }

  return NextResponse.json({ keywords: nextKeywords })
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

  if (nextKeywords.length < keywords.length && nextKeywords.length < MIN_TARGET_KEYWORDS) {
    return buildError(`Keep at least ${MIN_TARGET_KEYWORDS} target keywords.`)
  }

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
