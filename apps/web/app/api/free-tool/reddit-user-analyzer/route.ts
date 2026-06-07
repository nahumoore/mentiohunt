import { type NextRequest, NextResponse } from "next/server"
import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"

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
    FREE_TOOL_NAMES.redditUserAnalyzer,
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

  const rawUsername =
    body !== null &&
    typeof body === "object" &&
    "username" in body &&
    typeof (body as Record<string, unknown>).username === "string"
      ? (body as { username: string }).username.trim()
      : ""

  if (!rawUsername) {
    return NextResponse.json({ error: "username is required" }, { status: 400 })
  }

  const serverRes = await fetch(`${SERVER_URL}/reddit-user-analyzer`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": INTERNAL_API_KEY,
      "x-forwarded-client-ip": ip,
    },
    body: JSON.stringify({ username: rawUsername }),
  })

  const data = await serverRes.json()

  return NextResponse.json(data, {
    status: serverRes.status,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  })
}
