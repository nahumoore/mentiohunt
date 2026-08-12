import { type NextRequest, NextResponse } from "next/server"

import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"

export const maxDuration = 60

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? ""

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
    FREE_TOOL_NAMES.backlinkMonitor,
    ip
  )

  if (!allowed) {
    return NextResponse.json(
      { error: "Daily limit reached. Come back tomorrow." },
      { status: 429, headers: { "X-RateLimit-Remaining": "0" } }
    )
  }

  let body: { domain?: string; urls?: string[] }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.domain || !Array.isArray(body.urls) || body.urls.length === 0) {
    return NextResponse.json(
      { error: "domain and at least one url are required" },
      { status: 400 }
    )
  }

  try {
    const serverRes = await fetch(`${SERVER_URL}/free-tool/backlink-monitor`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
        "x-forwarded-client-ip": ip,
      },
      body: JSON.stringify({ domain: body.domain, urls: body.urls }),
    })

    const data = (await serverRes.json()) as unknown
    return NextResponse.json(data, {
      status: serverRes.status,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    })
  } catch {
    return NextResponse.json(
      { error: "Service unavailable. Please try again." },
      { status: 503 }
    )
  }
}
