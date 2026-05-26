import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token_hash = searchParams.get("token_hash")
  const type = searchParams.get("type") as
    | "signup"
    | "recovery"
    | "email_change"
    | null

  if (!token_hash || !type) {
    return NextResponse.redirect(`${origin}/signin?auth_error=1`)
  }

  const supabase = await supabaseServer()
  const { error } = await supabase.auth.verifyOtp({ token_hash, type })

  if (error) {
    return NextResponse.redirect(`${origin}/confirm?expired=1`)
  }

  return NextResponse.redirect(`${origin}/api/auth/post-signin`)
}
