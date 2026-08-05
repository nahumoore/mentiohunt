import { TRACKED_LINKS_MAX_PER_PRODUCT } from "@/consts/billing"
import { assertSafeUrl } from "@/lib/onboarding/fetch-site"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import { NextResponse } from "next/server"
import { z } from "zod"
import { hostnameOf, normalizeUrl, safeHostnameOf } from "./_shared"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

function buildError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

const createTrackedLinkSchema = z.object({
  source_url: z.string().min(1),
  expected_target_url: z.string().min(1).nullish(),
  label: z.string().trim().max(120).nullish(),
})

function triggerCheck(trackedLinkId: string) {
  waitUntil(
    fetch(`${SERVER_URL}/link-tracker/check`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify({ trackedLinkId }),
    }).catch((err) => {
      console.error("Failed to trigger link-tracker check:", err)
    })
  )
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = createTrackedLinkSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  let sourceUrl: string
  try {
    sourceUrl = normalizeUrl(parsed.data.source_url)
  } catch {
    return buildError("Invalid URL.")
  }

  try {
    await assertSafeUrl(sourceUrl)
  } catch (err) {
    return buildError(err instanceof Error ? err.message : "That URL can't be fetched.")
  }

  let expectedTargetUrl: string | null = null
  if (parsed.data.expected_target_url) {
    try {
      expectedTargetUrl = normalizeUrl(parsed.data.expected_target_url)
    } catch {
      return buildError("Invalid target URL.")
    }
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, website_url")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single()
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  // Paid-plan only — free/trial accounts see a page-level paywall instead of
  // this form, so this is a hard gate regardless of active_trial.
  if (!isPaid) {
    return buildError("Link Tracker is a paid-plan feature.", 403)
  }

  const { count: trackedCount } = await supabase
    .from("tracked_links" as string)
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)

  if ((trackedCount ?? 0) >= TRACKED_LINKS_MAX_PER_PRODUCT) {
    return buildError(`You've reached the ${TRACKED_LINKS_MAX_PER_PRODUCT}-link tracking limit for this product.`, 403)
  }

  const ownHost = safeHostnameOf(product.website_url)
  const sourceHost = hostnameOf(sourceUrl)

  if (ownHost && sourceHost === ownHost) {
    return buildError("That's your own site — Link Tracker monitors pages on other sites that link to you.")
  }

  if (expectedTargetUrl) {
    const targetHost = safeHostnameOf(expectedTargetUrl)
    if (!ownHost || targetHost !== ownHost) {
      return buildError("The target URL should be a page on your own site.")
    }
  }

  const { data: existing } = await supabase
    .from("tracked_links" as string)
    .select("id")
    .eq("product_id", product.id)
    .eq("source_url", sourceUrl)
    .maybeSingle()

  if (existing) {
    const row = existing as unknown as { id: string }
    return buildError("You're already tracking this page.", 409, { trackedLinkId: row.id })
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tracked_links" as string)
    .insert({
      product_id: product.id,
      source_url: sourceUrl,
      source_domain: sourceHost,
      expected_target_url: expectedTargetUrl,
      label: parsed.data.label?.trim() || null,
      origin: "manual",
      status: "pending",
      next_check_at: new Date().toISOString(),
    })
    .select("*")
    .single()

  if (insertError || !inserted) {
    if (insertError?.code === "23505") {
      const { data: raced } = await supabase
        .from("tracked_links" as string)
        .select("id")
        .eq("product_id", product.id)
        .eq("source_url", sourceUrl)
        .maybeSingle()

      return buildError("You're already tracking this page.", 409, { trackedLinkId: (raced as { id: string } | null)?.id })
    }

    console.error("Error inserting tracked link:", insertError)
    return buildError("Failed to add link.", 500)
  }

  const row = inserted as unknown as { id: string }
  triggerCheck(row.id)

  return NextResponse.json(inserted, { status: 201 })
}

export async function DELETE(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const id = new URL(request.url).searchParams.get("id")
  if (!id) return buildError("id is required.")

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  const { error: deleteError } = await supabase
    .from("tracked_links" as string)
    .delete()
    .eq("id", id)
    .eq("product_id", product.id)

  if (deleteError) {
    console.error("Error deleting tracked link:", deleteError)
    return buildError("Failed to remove link.", 500)
  }

  return NextResponse.json({ success: true })
}
