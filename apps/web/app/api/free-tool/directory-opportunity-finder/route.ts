import { NextRequest, NextResponse } from "next/server"
import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"

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
    FREE_TOOL_NAMES.directoryBacklinkOpportunityFinder,
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

  const rawProductUrl =
    body !== null &&
    typeof body === "object" &&
    "productUrl" in body &&
    typeof (body as Record<string, unknown>).productUrl === "string"
      ? (body as { productUrl: string }).productUrl.trim()
      : ""

  const freeOnly =
    body !== null &&
    typeof body === "object" &&
    "freeOnly" in body &&
    (body as Record<string, unknown>).freeOnly === true

  if (!rawProductUrl) {
    return NextResponse.json({ error: "productUrl is required" }, { status: 400 })
  }

  const url = normalizeUrl(rawProductUrl)
  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Enter a valid product URL." }, { status: 400 })
  }

  let siteDetails
  try {
    siteDetails = await fetchSiteDetails(url)
  } catch (err) {
    return NextResponse.json(
      { error: "Could not reach that URL. Check it and try again." },
      { status: 422 }
    )
  }

  const productName = siteDetails.title?.trim()
  if (!productName) {
    return NextResponse.json(
      { error: "Couldn't read product name from page. Try the canonical URL." },
      { status: 422 }
    )
  }

  const serverRes = await fetch(
    `${SERVER_URL}/find-directory-opportunities-by-url`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
        "x-forwarded-client-ip": ip,
      },
      body: JSON.stringify({ url, productName, freeOnly }),
    }
  )

  const data = await serverRes.json()

  return NextResponse.json(data, {
    status: serverRes.status,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  })
}
