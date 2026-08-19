import { getMaxCompetitors } from "@/consts/billing"
import { normalizeUrl } from "@/consts/onboarding"
import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const urlSchema = z
  .string()
  .min(1)
  .transform(normalizeUrl)
  .pipe(z.string().url("Enter a valid website URL."))

async function loadProductAndTier(
  supabase: Awaited<ReturnType<typeof supabaseServer>>,
  userId: string
) {
  const [{ data: product, error: productError }, { data: profile }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, competitors")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabase.from("profiles").select("tier").eq("id", userId).single(),
    ])

  if (productError) {
    console.error("Error fetching competitors product:", productError)
    return { error: buildError("Failed to update competitors.", 500) }
  }

  if (!product) {
    return { error: buildError("Product not found.", 404) }
  }

  return { product, maxCompetitors: getMaxCompetitors(profile?.tier) }
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = z.object({ url: urlSchema }).safeParse(body)

  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { product, maxCompetitors, error } = await loadProductAndTier(
    supabase,
    user.id
  )
  if (error) return error

  const competitors = product.competitors ?? []
  const url = parsed.data.url

  if (competitors.some((existing: string) => existing.toLowerCase() === url.toLowerCase())) {
    return buildError("Already added.", 409)
  }

  if (competitors.length >= maxCompetitors) {
    return buildError(`You can track up to ${maxCompetitors} competitors on your plan.`, 403)
  }

  const nextCompetitors = [...competitors, url]

  const { error: updateError } = await supabase
    .from("products")
    .update({ competitors: nextCompetitors })
    .eq("id", product.id)

  if (updateError) {
    console.error("Error adding competitor:", updateError)
    return buildError("Failed to add competitor.", 500)
  }

  return NextResponse.json({ competitors: nextCompetitors }, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = z.object({ url: z.string().min(1) }).safeParse(body)

  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { product, error } = await loadProductAndTier(supabase, user.id)
  if (error) return error

  const competitors = product.competitors ?? []
  const nextCompetitors = competitors.filter(
    (existing: string) => existing !== parsed.data.url
  )

  const { error: updateError } = await supabase
    .from("products")
    .update({ competitors: nextCompetitors })
    .eq("id", product.id)

  if (updateError) {
    console.error("Error removing competitor:", updateError)
    return buildError("Failed to remove competitor.", 500)
  }

  return NextResponse.json({ competitors: nextCompetitors })
}
