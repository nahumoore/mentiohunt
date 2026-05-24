import { supabaseServer } from "@/lib/supabase/server"
import type { Database } from "@workspace/supabase/database-types"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

type DirectorySubmissionStatus =
  Database["public"]["Enums"]["directory_submission_status"]

const STATUSES: [DirectorySubmissionStatus, ...DirectorySubmissionStatus[]] = [
  "not_submitted",
  "submitted",
  "indexed",
  "not_indexed",
  "dismissed",
]

const patchSchema = z.object({
  ids: z.array(z.string().uuid()).min(1),
  status: z.enum(STATUSES),
})

function error(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function PATCH(request: Request) {
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return error("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsed = patchSchema.safeParse(body)

  if (!parsed.success) {
    return error(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { ids, status } = parsed.data

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (productError) {
    return error("Failed to fetch product.", 500)
  }

  if (!product) {
    return error("Product not found.", 404)
  }

  const extra: { submitted_at?: string } = {}
  if (status === "submitted") {
    extra.submitted_at = new Date().toISOString()
  }

  const { data, error: updateError } = await supabase
    .from("directory_submissions")
    .update({ status, ...extra })
    .in("id", ids)
    .eq("product_id", product.id)
    .select("id, submitted_at")

  if (updateError) {
    return error(updateError.message, 500)
  }

  return NextResponse.json({ updated: data ?? [] })
}
