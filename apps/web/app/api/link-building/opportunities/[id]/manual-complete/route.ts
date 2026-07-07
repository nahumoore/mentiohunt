import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? ""

const bodySchema = z.object({
  contact_name: z.string().trim().min(1, "Contact name is required."),
  contact_email: z.string().trim().email("Enter a valid email address."),
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
  const parsed = bodySchema.safeParse(body)

  if (!parsed.success) {
    return err(parsed.error.issues[0]?.message ?? "Invalid request payload.")
  }

  const { data: prospect, error: fetchError } = await supabase
    .from("backlink_prospects")
    .select("id, product_id, status")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching prospect:", fetchError)
    return err("Failed to fetch opportunity.", 500)
  }

  if (!prospect) {
    return err("Opportunity not found.", 404)
  }

  if (prospect.status !== "email_not_found") {
    return err("This opportunity is not awaiting manual completion.", 400)
  }

  const { data: owned } = await supabase
    .from("products")
    .select("id")
    .eq("id", prospect.product_id)
    .eq("user_id", user.id)
    .maybeSingle()

  if (!owned) {
    return err("Opportunity not found.", 404)
  }

  const { error: updateError } = await supabase
    .from("backlink_prospects")
    .update({
      contact_name: parsed.data.contact_name,
      contact_email: parsed.data.contact_email,
    })
    .eq("id", id)

  if (updateError) {
    console.error("Error saving contact details:", updateError)
    return err("Failed to save contact details.", 500)
  }

  try {
    const serverRes = await fetch(`${SERVER_URL}/prospects/manual-outreach`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        userId: user.id,
        productId: prospect.product_id,
        prospectId: id,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    const data = await serverRes
      .json()
      .catch(() => ({ error: "Failed to generate outreach." }))

    return NextResponse.json(data, { status: serverRes.status })
  } catch (error) {
    console.error("Error reaching outreach service:", error)
    return err("Service unavailable. Please try again.", 503)
  }
}
