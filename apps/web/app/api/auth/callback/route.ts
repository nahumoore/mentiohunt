import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { handlePostSignin } from "../_handle-new-user"

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")

  if (!code) {
    return NextResponse.redirect(`${origin}/signin?auth_error=1`)
  }

  const supabase = await supabaseServer()
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error || !data.user) {
    return NextResponse.redirect(`${origin}/signin?auth_error=1`)
  }

  const user = data.user

  if (!user.email) {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/signin?auth_error=profile_creation_error`)
  }

  const result = await handlePostSignin(supabase, user as Parameters<typeof handlePostSignin>[1])

  if (result.redirect === "error") {
    await supabase.auth.signOut()
    return NextResponse.redirect(`${origin}/signin?auth_error=${result.reason}`)
  }

  return NextResponse.redirect(`${origin}/${result.redirect}`)
}
