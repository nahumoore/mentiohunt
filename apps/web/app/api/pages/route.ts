import { MAX_TRACKED_PAGES } from "@/consts/billing"
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
})

const reorderPagesSchema = z.object({
  ids: z
    .array(z.string().uuid())
    .min(1)
    .max(MAX_TRACKED_PAGES)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Each page should appear once.",
    }),
})

const deletePageSchema = z.object({
  id: z.string().uuid(),
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

  const { page_type } = parsed.data
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

  // Enforce the total tracked-pages limit — auto-selected and manually-added
  // pages both count against it.
  const { count } = await supabase
    .from("product_pages")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("is_target", true)

  if ((count ?? 0) >= MAX_TRACKED_PAGES) {
    return buildError(`You can track up to ${MAX_TRACKED_PAGES} pages.`, 403)
  }

  // Manually added pages append to the end of the priority order (the
  // lowest-ranked open slot) — same convention as adding a target keyword.
  // The user can drag it up afterward.
  const priority = (count ?? 0) + 1

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

export async function PUT(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = reorderPagesSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { ids } = parsed.data

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  const { data: existingPages, error: existingError } = await supabase
    .from("product_pages")
    .select("id")
    .eq("product_id", product.id)
    .eq("is_target", true)

  if (existingError) {
    console.error("Error loading pages to reorder:", existingError)
    return buildError("Failed to reorder pages.", 500)
  }

  // PUT reorders the existing target set — it does not add or remove pages.
  const currentSet = new Set((existingPages ?? []).map((p) => p.id))
  const nextSet = new Set(ids)
  const sameSet =
    currentSet.size === nextSet.size && Array.from(currentSet).every((id) => nextSet.has(id))

  if (!sameSet) {
    return buildError("Reordering can't add or remove pages.")
  }

  const results = await Promise.all(
    ids.map((id, index) =>
      supabase
        .from("product_pages")
        .update({ priority: index + 1 })
        .eq("id", id)
        .eq("product_id", product.id)
    )
  )

  const updateError = results.find((r) => r.error)?.error
  if (updateError) {
    console.error("Error reordering pages:", updateError)
    return buildError("Failed to reorder pages.", 500)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = deletePageSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { id } = parsed.data

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  // Same FK as reconcileTargetPages (crawl-product-pages.ts): product_pages
  // is ON DELETE SET NULL for backlink_prospects.product_page_id, so deleting
  // a page with prospects attached silently detaches them rather than
  // deleting the prospects — that's fine here since it's a deliberate,
  // user-initiated delete rather than an automated reconciliation pass.
  const { error: deleteError, count } = await supabase
    .from("product_pages")
    .delete({ count: "exact" })
    .eq("id", id)
    .eq("product_id", product.id)

  if (deleteError) {
    console.error("Error deleting product page:", deleteError)
    return buildError("Failed to delete page.", 500)
  }

  if (!count) {
    return buildError("Page not found.", 404)
  }

  return NextResponse.json({ success: true })
}
