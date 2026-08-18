import { createClient } from "@workspace/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"]

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isProtected = PROTECTED_ROUTES.some((route) => pathname.startsWith(route))

  let supabaseResponse: NextResponse
  let user = null

  try {
    const client = createClient(request)
    supabaseResponse = client.supabaseResponse
    const { data } = await client.supabase.auth.getUser()
    user = data.user
  } catch {
    // Stale/invalid refresh token (e.g. AuthApiError refresh_token_not_found) can throw
    // from Supabase's internal auto-refresh path, outside the getUser() promise chain.
    // Treat as unauthenticated and clear the stale sb-* cookies so it doesn't retrigger.
    supabaseResponse = NextResponse.next({ request: { headers: request.headers } })
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.startsWith("sb-")) {
        supabaseResponse.cookies.delete(cookie.name)
      }
    }
    user = null
  }

  if (isProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = "/signin"
    return NextResponse.redirect(url)
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
