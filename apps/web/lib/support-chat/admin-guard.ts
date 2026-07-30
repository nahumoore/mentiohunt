import { notFound } from "next/navigation"
import { NextResponse } from "next/server"

// The founder-facing console has no auth model of its own — it simply does
// not exist outside `pnpm dev`. Access to real conversation data is gated
// entirely by this check, matching the `isDev`-gated route pattern already
// used for internal tooling in apps/server/src/routes/index.ts.
function isDevOnly(): boolean {
  return process.env.NODE_ENV === "development"
}

/** For the /support Server Component page: 404s outside development. */
export function assertDevOnlyPage(): void {
  if (!isDevOnly()) notFound()
}

/** For admin route handlers: returns a 404 response outside development, or null if allowed to proceed. */
export function devOnlyGuard(): NextResponse | null {
  if (isDevOnly()) return null
  return NextResponse.json({ error: "Not found" }, { status: 404 })
}
