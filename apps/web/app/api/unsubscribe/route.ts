import { supabaseAdmin } from "@workspace/supabase/admin"
import { createHmac, timingSafeEqual } from "node:crypto"
import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

type EmailType = "alerts" | "marketing"

function verifyToken(uid: string, type: string, sig: string): boolean {
  const secret = process.env.INTERNAL_API_KEY
  if (!secret) return false
  try {
    const expected = createHmac("sha256", secret)
      .update(`${uid}:${type}`)
      .digest("hex")
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  } catch {
    return false
  }
}

export async function GET(req: NextRequest) {
  const uid = req.nextUrl.searchParams.get("uid") ?? ""
  const type = req.nextUrl.searchParams.get("type") ?? ""
  const sig = req.nextUrl.searchParams.get("sig") ?? ""

  if (!uid || !["alerts", "marketing"].includes(type) || !sig) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 })
  }

  if (!verifyToken(uid, type, sig)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const { data: profile, error: fetchError } = await supabaseAdmin
    .from("profiles")
    .select("email_settings")
    .eq("id", uid)
    .single()

  if (fetchError) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const current =
    (profile?.email_settings as Record<string, boolean> | null) ?? {
      marketing: true,
      alerts: true,
    }

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ email_settings: { ...current, [type as EmailType]: false } })
    .eq("id", uid)

  if (updateError) {
    return NextResponse.json({ error: "Failed to unsubscribe" }, { status: 500 })
  }

  return NextResponse.json({ success: true, unsubscribed: type })
}
