import { PAID_MAX_URL_SUBMISSIONS_PER_DAY } from "@/consts/billing"
import { assertSafeUrl } from "@/lib/onboarding/fetch-site"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

function buildError(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

const submitUrlSchema = z.object({
  url: z.string().min(1),
  product_page_id: z.string().uuid().nullish(),
})

function normalizeUrl(raw: string): string {
  const trimmed = raw.trim()
  const withScheme = trimmed.startsWith("http") ? trimmed : `https://${trimmed}`
  const parsed = new URL(withScheme)
  parsed.hash = ""
  if (parsed.pathname !== "/" && parsed.pathname.endsWith("/")) {
    parsed.pathname = parsed.pathname.slice(0, -1)
  }
  return parsed.toString()
}

function hostnameOf(url: string): string {
  return new URL(url).hostname.replace(/^www\./, "").toLowerCase()
}

function utcDayStart(): string {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())).toISOString()
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized", 401)

  const body = await request.json().catch(() => null)
  const parsed = submitUrlSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  let url: string
  try {
    url = normalizeUrl(parsed.data.url)
  } catch {
    return buildError("Invalid URL.")
  }

  try {
    await assertSafeUrl(url)
  } catch (err) {
    return buildError(err instanceof Error ? err.message : "That URL can't be fetched.")
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, website_url")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.", 404)
  }

  const submittedHost = hostnameOf(url)
  const ownHost = (() => {
    try {
      return hostnameOf(product.website_url)
    } catch {
      return null
    }
  })()
  if (ownHost && submittedHost === ownHost) {
    return buildError("That's your own site — submit a prospect's page instead.")
  }

  if (parsed.data.product_page_id) {
    const { data: page } = await supabase
      .from("product_pages")
      .select("id")
      .eq("id", parsed.data.product_page_id)
      .eq("product_id", product.id)
      .maybeSingle()

    if (!page) return buildError("Page not found.", 404)
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier")
    .eq("id", user.id)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  // Paid-plan only — free and free-trial accounts get a paywall in the
  // dialog, not a form, so this is a hard gate regardless of active_trial.
  if (!isPaid) {
    return buildError("Submitting your own URLs is a paid-plan feature.", 403)
  }

  const dailyCap = PAID_MAX_URL_SUBMISSIONS_PER_DAY
  const { count: submittedToday } = await supabase
    .from("backlink_prospects")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)
    .eq("tier", "user_submitted")
    .gte("created_at", utcDayStart())

  if ((submittedToday ?? 0) >= dailyCap) {
    return buildError(`You've used all ${dailyCap} URL submissions for today. Try again tomorrow.`, 429)
  }

  const { data: existing } = await supabase
    .from("backlink_prospects")
    .select("id")
    .eq("product_id", product.id)
    .eq("found_url", url)
    .maybeSingle()

  if (existing) {
    return buildError("You already have an opportunity for this page.", 409, { prospectId: existing.id })
  }

  // select("*") — the client passes this straight into the prospect store's
  // upsertProspectDetail, which expects the full row shape, not just the
  // list-item columns.
  const { data: prospect, error: insertError } = await supabase
    .from("backlink_prospects")
    .insert({
      product_id: product.id,
      product_page_id: parsed.data.product_page_id ?? null,
      found_url: url,
      domain: submittedHost,
      tier: "user_submitted",
      status: "new",
      enrichment_status: "pending",
      raw_metadata: {
        user_submitted: {
          submitted_at: new Date().toISOString(),
          target_page_mode: parsed.data.product_page_id ? "manual" : "auto",
        },
      },
    })
    .select("*")
    .single()

  if (insertError || !prospect) {
    // A daily-discovery run can race us onto the same found_url between our
    // pre-check above and this insert — report it the same way as the
    // pre-check duplicate rather than a generic 500.
    if (insertError?.code === "23505") {
      const { data: raced } = await supabase
        .from("backlink_prospects")
        .select("id")
        .eq("product_id", product.id)
        .eq("found_url", url)
        .maybeSingle()

      return buildError("You already have an opportunity for this page.", 409, {
        prospectId: raced?.id,
      })
    }

    console.error("Error inserting submitted prospect:", insertError)
    return buildError("Failed to submit URL.", 500)
  }

  waitUntil(
    fetch(`${SERVER_URL}/prospects/submit-url`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      },
      body: JSON.stringify({ userId: user.id, productId: product.id, prospectId: prospect.id }),
    }).catch((err) => {
      console.error("Failed to trigger submit-url pipeline:", err)
    })
  )

  return NextResponse.json(prospect, { status: 201 })
}
