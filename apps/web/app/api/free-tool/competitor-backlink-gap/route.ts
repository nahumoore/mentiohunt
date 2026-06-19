import { type NextRequest, NextResponse } from "next/server"

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY ?? ""

export async function POST(req: NextRequest) {
  const clientIp =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"

  let body: { url?: string }
  try {
    body = (await req.json()) as typeof body
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (!body.url) {
    return NextResponse.json({ error: "url required" }, { status: 400 })
  }

  try {
    const serverRes = await fetch(`${SERVER_URL}/free-tool/competitor-backlink-gap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
        "x-forwarded-client-ip": clientIp,
      },
      body: JSON.stringify({ url: body.url }),
    })

    const data = (await serverRes.json()) as unknown
    return NextResponse.json(data, { status: serverRes.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again." }, { status: 503 })
  }
}
