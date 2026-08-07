import { type NextRequest, NextResponse } from "next/server"

import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { MAX_EMAILS_PER_CHECK, verifyEmails } from "@/lib/free-tools/verify-emails"

export const maxDuration = 30

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed, remaining } = checkFreeToolRateLimit(
    FREE_TOOL_NAMES.bulkEmailVerifier,
    ip
  )

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Come back tomorrow." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const emails =
    body !== null &&
    typeof body === "object" &&
    "emails" in body &&
    Array.isArray((body as Record<string, unknown>).emails)
      ? ((body as { emails: unknown[] }).emails.filter(
          (e): e is string => typeof e === "string"
        ))
      : []

  if (emails.length === 0) {
    return NextResponse.json({ error: "At least one email is required" }, { status: 400 })
  }

  if (emails.length > MAX_EMAILS_PER_CHECK) {
    return NextResponse.json(
      {
        error: `Max ${MAX_EMAILS_PER_CHECK} emails per check — trim your list and try again.`,
      },
      { status: 400 }
    )
  }

  try {
    const results = await verifyEmails(emails)

    return NextResponse.json(
      { results },
      { status: 200, headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  } catch {
    return NextResponse.json(
      { error: "Could not verify those addresses. Please try again." },
      { status: 500, headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }
}
