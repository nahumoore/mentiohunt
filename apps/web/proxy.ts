import { createClient } from "@workspace/supabase/middleware"
import { NextResponse, type NextRequest } from "next/server"

const PROTECTED_ROUTES = ["/dashboard", "/onboarding"]

// Pages with a machine-readable markdown counterpart, negotiated via the
// Accept header (see acceptmarkdown.com). Vary: Accept must be set on both
// representations so CDNs cache the html and markdown variants separately.
const MARKDOWN_NEGOTIABLE_ROUTES: Record<string, string> = {
  "/": "/md/home",
  "/pricing": "/pricing.md",
}

function prefersMarkdown(request: NextRequest): boolean {
  const accept = request.headers.get("accept")
  if (!accept) return false

  const entries = accept.split(",").map((part) => {
    const [type, ...params] = part.trim().split(";")
    const qParam = params.find((p) => p.trim().startsWith("q="))
    const q = qParam ? Number.parseFloat(qParam.trim().slice(2)) : 1
    return { type: type!.trim().toLowerCase(), q: Number.isNaN(q) ? 1 : q }
  })

  const markdown = entries.find((e) => e.type === "text/markdown")
  if (!markdown) return false

  const html = entries.find((e) => e.type === "text/html" || e.type === "*/*")
  return !html || markdown.q >= html.q
}

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

  const markdownTarget = MARKDOWN_NEGOTIABLE_ROUTES[pathname]
  if (markdownTarget && request.method === "GET" && prefersMarkdown(request)) {
    const rewritten = NextResponse.rewrite(new URL(markdownTarget, request.url))
    for (const cookie of supabaseResponse.cookies.getAll()) {
      rewritten.cookies.set(cookie)
    }
    rewritten.headers.set("Vary", "Accept, Accept-Encoding")
    return rewritten
  }

  if (markdownTarget) {
    supabaseResponse.headers.set("Vary", "Accept, Accept-Encoding")
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}
