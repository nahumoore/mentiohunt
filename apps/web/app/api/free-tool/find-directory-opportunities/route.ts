import { NextRequest, NextResponse } from "next/server"
import {
  checkFreeToolRateLimit,
  FREE_TOOL_NAMES,
} from "@/consts/free-tools"

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
    FREE_TOOL_NAMES.directoryOpportunityFinder,
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

  const rawProductId =
    body !== null &&
    typeof body === "object" &&
    "productId" in body &&
    typeof (body as Record<string, unknown>).productId === "string"
      ? (body as { productId: string }).productId
      : ""
  const productId = rawProductId.trim()

  if (!productId) {
    return NextResponse.json(
      { error: "productId is required" },
      { status: 400 }
    )
  }

  const serverRes = await fetch(
    `${SERVER_URL}/find-directory-opportunities`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    }
  )

  const data = await serverRes.json()

  return NextResponse.json(data, {
    status: serverRes.status,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  })
}
