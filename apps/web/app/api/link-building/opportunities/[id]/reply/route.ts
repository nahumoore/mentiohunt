import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { z } from "zod"

export const runtime = "nodejs"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? ""

const bodySchema = z.object({
  body: z.string().trim().min(1, "Reply message is required."),
  emailAccountId: z.string().trim().min(1).optional(),
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
    .select("id, product_id")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) {
    console.error("Error fetching prospect:", fetchError)
    return err("Failed to fetch opportunity.", 500)
  }

  if (!prospect) {
    return err("Opportunity not found.", 404)
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

  try {
    const serverRes = await fetch(`${SERVER_URL}/prospects/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
      },
      body: JSON.stringify({
        userId: user.id,
        productId: prospect.product_id,
        prospectId: id,
        body: parsed.data.body,
        emailAccountId: parsed.data.emailAccountId,
      }),
      signal: AbortSignal.timeout(60_000),
    })

    const data = await serverRes.json().catch(() => ({ error: "Failed to send reply." }))

    return NextResponse.json(data, { status: serverRes.status })
  } catch (error) {
    console.error("Error reaching outreach service:", error)
    return err("Service unavailable. Please try again.", 503)
  }
}
