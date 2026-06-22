import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { handlePostSignin } from "../_handle-new-user"

export async function GET(request: NextRequest) {
  const { origin, searchParams } = new URL(request.url)
  const confirmed = searchParams.get("confirmed")
  const supabase = await supabaseServer()

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user?.email) {
    return NextResponse.redirect(`${origin}/signin?auth_error=1`)
  }

  const result = await handlePostSignin(supabase, user as Parameters<typeof handlePostSignin>[1])

  if (result.redirect === "error") {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/signin?auth_error=${result.reason}`)
  }

  const suffix = confirmed ? `?confirmed=${confirmed}` : ""
  return NextResponse.redirect(`${origin}/${result.redirect}${suffix}`)
}
