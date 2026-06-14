import { NextResponse } from "next/server"
import { z } from "zod"

import { supabaseServer } from "@/lib/supabase/server"
import type { TablesInsert } from "@workspace/supabase/database-types"

export const runtime = "nodejs"

const reportIssueSchema = z.object({
  message: z.string().trim().min(10, "Please add a bit more detail."),
})

function err(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const supabase = await supabaseServer()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return err("Unauthorized", 401)
  }

  const body = await request.json().catch(() => null)
  const parsed = reportIssueSchema.safeParse(body)

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("backlink_prospects")
    .select(
      "id, product_id, tier, domain, target_url, found_url, contact_email, contact_name"
    )
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching prospect for issue report:", fetchError)
    return err("Failed to fetch opportunity.", 500)
  }

  if (!prospect) {
    return err("Opportunity not found.", 404)
  }

  const { data: owned, error: ownedError } = await supabase
    .from("products")
    .select("id")
    .eq("id", prospect.product_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (ownedError) {
    console.error("Error checking prospect ownership:", ownedError)
    return err("Failed to verify opportunity.", 500)
  }

  if (!owned) {
    return err("Opportunity not found.", 404)
  }

  const issuePayload: TablesInsert<"reported_issues"> = {
    prospect_id: prospect.id,
    product_id: prospect.product_id,
    user_id: user.id,
    message: parsed.data.message,
    metadata: {
      tier: prospect.tier,
      domain: prospect.domain,
      target_url: prospect.target_url,
      found_url: prospect.found_url,
      contact_email: prospect.contact_email,
      contact_name: prospect.contact_name,
      reported_by_email: user.email ?? null,
    },
  }

  const { error: insertError } = await supabase
    .from("reported_issues")
    .insert(issuePayload)

  if (insertError) {
    console.error("Error creating issue report:", insertError)
    return err("Failed to submit issue report.", 500)
  }

  return NextResponse.json({ ok: true })
}
