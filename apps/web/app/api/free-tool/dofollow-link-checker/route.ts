import { type NextRequest, NextResponse } from "next/server"

import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { fetchPageLinks } from "@/lib/free-tools/fetch-page-links"

export const maxDuration = 30

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function normalizeUrl(rawUrl: string): string {
  if (/^https?:\/\//i.test(rawUrl)) {
    return rawUrl
  }

  return `https://${rawUrl}`
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed, remaining } = checkFreeToolRateLimit(
    FREE_TOOL_NAMES.dofollowLinkChecker,
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

  const rawUrl =
    body !== null &&
    typeof body === "object" &&
    "url" in body &&
    typeof (body as Record<string, unknown>).url === "string"
      ? (body as { url: string }).url.trim()
      : ""

  if (!rawUrl) {
    return NextResponse.json({ error: "url is required" }, { status: 400 })
  }

  let parsedUrl: URL
  try {
    parsedUrl = new URL(normalizeUrl(rawUrl))
  } catch {
    return NextResponse.json({ error: "Enter a valid URL" }, { status: 400 })
  }

  try {
    const result = await fetchPageLinks(parsedUrl.toString())

    return NextResponse.json(result, {
      status: 200,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    })
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Could not check that page"

    return NextResponse.json(
      { error: message },
      { status: 422, headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }
}
