import { NextRequest, NextResponse } from "next/server"
import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { normalizeUrl } from "@/consts/onboarding"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"

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
    FREE_TOOL_NAMES.backlinkPriceCalculator,
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

  const url = normalizeUrl(rawUrl)
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Enter a valid URL." }, { status: 400 })
  }

  const serverRes = await fetch(`${SERVER_URL}/analyze-backlink-site`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      "x-forwarded-client-ip": ip,
    },
    body: JSON.stringify({ url }),
  })

  const data = await serverRes.json()

  return NextResponse.json(data, {
    status: serverRes.status,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  })
}
