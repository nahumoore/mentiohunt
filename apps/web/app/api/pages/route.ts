import { MAX_MANUAL_PAGES_FREE, MAX_MANUAL_PAGES_PAID } from "@/consts/billing"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const createPageSchema = z.object({
  url: z.string().min(1),
  page_type: z.enum(["article", "resource", "free_tool", "landing_page", "case_study", "comparison"]),
  priority: z.number().int().min(1).max(5),
})

const updatePrioritySchema = z.object({
  id: z.string().uuid(),
  priority: z.number().int().min(1).max(5),
})

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  return trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = createPageSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { page_type, priority } = parsed.data
  const url = normalizeUrl(parsed.data.url)

  // Validate that it's a real URL after normalization
  try {
    new URL(url)
  } catch {
    return buildError("Invalid URL.")
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  // Enforce free-tier page limit
  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  const manualCap = isPaid ? MAX_MANUAL_PAGES_PAID : MAX_MANUAL_PAGES_FREE

  const { count } = await supabase
    .from("product_pages")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("is_manual", true)

  if ((count ?? 0) >= manualCap) {
    return buildError(`You can add up to ${manualCap} manual pages.`, 403)
  }

  const { data: page, error: insertError } = await supabase
    .from("product_pages")
    .upsert(
      {
        product_id: product.id,
        url,
        page_type,
        priority,
        is_manual: true,
        is_target: true,
        crawl_status: "pending",
      },
      { onConflict: "product_id,url", ignoreDuplicates: true }
    )
    .select("id, url, title, description, page_type, priority, crawl_status")
    .single()

  if (insertError) {
    if (insertError.code === "PGRST116") {
      return buildError("This page is already being tracked.", 409)
    }
    console.error("Error inserting product page:", insertError)
    return buildError("Failed to add page.", 500)
  }
  if (!page) {
    return buildError("This page is already being tracked.", 409)
  }

  waitUntil(
    fetch(`${SERVER_URL}/pages/crawl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify({ productId: product.id, pageId: page.id }),
    }).catch((err) => {
      console.error("Failed to trigger page crawl:", err)
    })
  )

  return NextResponse.json(page, { status: 201 })
}

export async function PATCH(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = updatePrioritySchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { id, priority } = parsed.data

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  const { error: updateError } = await supabase
    .from("product_pages")
    .update({ priority })
    .eq("id", id)
    .eq("product_id", product.id)

  if (updateError) {
    console.error("Error updating page priority:", updateError)
    return buildError("Failed to update priority.", 500)
  }

  return NextResponse.json({ success: true })
}
