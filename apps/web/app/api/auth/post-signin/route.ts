import { supabaseServer } from "@/lib/supabase/server"
import { NextResponse, type NextRequest } from "next/server"
import { handlePostSignin } from "../_handle-new-user"

export async function GET(request: NextRequest) {
  const { origin } = new URL(request.url)
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

  return NextResponse.redirect(`${origin}/${result.redirect}`)
}
