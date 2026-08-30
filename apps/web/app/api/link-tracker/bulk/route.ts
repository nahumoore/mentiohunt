import { TRACKED_LINKS_MAX_PER_PRODUCT } from "@/consts/billing"
import { assertSafeUrl } from "@/lib/onboarding/fetch-site"
import { supabaseServer } from "@/lib/supabase/server"
import { waitUntil } from "@vercel/functions"
import { NextResponse } from "next/server"
import { z } from "zod"
import { hostnameOf, mapWithConcurrency, normalizeUrl, safeHostnameOf } from "../_shared"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const MAX_ROWS_PER_REQUEST = 100
const VALIDATION_CONCURRENCY = 10

function buildError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

const rowSchema = z.object({
  source_url: z.string().min(1),
  expected_target_url: z.string().min(1).nullish(),
  label: z.string().trim().max(120).nullish(),
})

const bulkSchema = z.object({
  rows: z.array(rowSchema).min(1).max(MAX_ROWS_PER_REQUEST),
})

type SkipReason =
  | "invalid_url"
  | "unsafe_url"
  | "own_domain"
  | "target_not_own_domain"
  | "duplicate_in_batch"
  | "already_tracked"
  | "cap_reached"

type SkippedRow = { url: string; reason: SkipReason }

type ValidatedRow = {
  source_url: string
  source_domain: string
  expected_target_url: string | null
  label: string | null
}

export async function POST(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) return buildError("Unauthorized")

  const body = await request.json().catch(() => null)
  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return buildError(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id, website_url")
    .eq("user_id", user.id)
    .single()

  if (productError || !product) {
    return buildError("No product found.")
  }

  const { data: profile } = await supabase.from("profiles").select("tier").eq("id", user.id).single()
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  if (!isPaid) {
    return buildError("Link Tracker is a paid-plan feature.")
  }

  const ownHost = safeHostnameOf(product.website_url)
  const skipped: SkippedRow[] = []
  const seenInBatch = new Set<string>()

  const validated = await mapWithConcurrency(parsed.data.rows, VALIDATION_CONCURRENCY, async (row): Promise<ValidatedRow | null> => {
    let sourceUrl: string
    try {
      sourceUrl = normalizeUrl(row.source_url)
    } catch {
      skipped.push({ url: row.source_url, reason: "invalid_url" })
      return null
    }

    try {
      await assertSafeUrl(sourceUrl)
    } catch {
      skipped.push({ url: sourceUrl, reason: "unsafe_url" })
      return null
    }

    const sourceHost = hostnameOf(sourceUrl)
    if (ownHost && sourceHost === ownHost) {
      skipped.push({ url: sourceUrl, reason: "own_domain" })
      return null
    }

    let expectedTargetUrl: string | null = null
    if (row.expected_target_url) {
      try {
        expectedTargetUrl = normalizeUrl(row.expected_target_url)
      } catch {
        skipped.push({ url: sourceUrl, reason: "invalid_url" })
        return null
      }
      const targetHost = safeHostnameOf(expectedTargetUrl)
      if (!ownHost || targetHost !== ownHost) {
        skipped.push({ url: sourceUrl, reason: "target_not_own_domain" })
        return null
      }
    }

    if (seenInBatch.has(sourceUrl)) {
      skipped.push({ url: sourceUrl, reason: "duplicate_in_batch" })
      return null
    }
    seenInBatch.add(sourceUrl)

    return {
      source_url: sourceUrl,
      source_domain: sourceHost,
      expected_target_url: expectedTargetUrl,
      label: row.label?.trim() || null,
    }
  })

  let candidates = validated.filter((row): row is ValidatedRow => row !== null)

  const { count: existingCount } = await supabase
    .from("tracked_links")
    .select("id", { count: "exact", head: true })
    .eq("product_id", product.id)

  const remainingCapacity = TRACKED_LINKS_MAX_PER_PRODUCT - (existingCount ?? 0)
  if (candidates.length > remainingCapacity) {
    const overflow = candidates.slice(Math.max(remainingCapacity, 0))
    candidates = candidates.slice(0, Math.max(remainingCapacity, 0))
    for (const row of overflow) {
      skipped.push({ url: row.source_url, reason: "cap_reached" })
    }
  }

  if (candidates.length === 0) {
    return NextResponse.json({ inserted: [], skipped })
  }

  const { data: inserted, error: insertError } = await supabase
    .from("tracked_links")
    .upsert(
      candidates.map((row) => ({
        product_id: product.id,
        source_url: row.source_url,
        source_domain: row.source_domain,
        expected_target_url: row.expected_target_url,
        label: row.label,
        origin: "bulk_import",
        status: "pending",
        next_check_at: new Date().toISOString(),
      })),
      { onConflict: "product_id,source_url", ignoreDuplicates: true }
    )
    .select("*")

  if (insertError) {
    console.error("Error bulk-inserting tracked links:", insertError)
    return buildError("Failed to import links.")
  }

  const insertedRows = (inserted ?? []) as unknown as Array<{ id: string; source_url: string }>
  // Rows that survived every pre-check but weren't returned by the upsert
  // conflicted with a link already tracked in a previous submission (the
  // ignoreDuplicates upsert doesn't return DO-NOTHING rows).
  const insertedUrls = new Set(insertedRows.map((r) => r.source_url))
  for (const row of candidates) {
    if (!insertedUrls.has(row.source_url)) {
      skipped.push({ url: row.source_url, reason: "already_tracked" })
    }
  }

  if (insertedRows.length > 0) {
    waitUntil(
      fetch(`${SERVER_URL}/link-tracker/check-batch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
        },
        body: JSON.stringify({ trackedLinkIds: insertedRows.map((r) => r.id) }),
      }).catch((err) => {
        console.error("Failed to trigger link-tracker batch check:", err)
      })
    )
  }

  return NextResponse.json({ inserted: insertedRows, skipped })
}
