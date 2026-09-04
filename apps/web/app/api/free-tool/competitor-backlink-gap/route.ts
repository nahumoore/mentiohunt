import { type NextRequest, NextResponse } from "next/server"
import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"

export const maxDuration = 300

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

  const rawUrl = typeof body.url === "string" ? body.url.trim() : ""
  if (!rawUrl) {
    return NextResponse.json({ error: "url required" }, { status: 400 })
  }

  const normalized = normalizeUrl(rawUrl)
  try {
    new URL(normalized)
  } catch {
    return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 })
  }

  let siteDetails: Awaited<ReturnType<typeof fetchSiteDetails>>
  try {
    siteDetails = await fetchSiteDetails(normalized)
  } catch {
    return NextResponse.json(
      { error: "Could not reach that URL. Check it and try again." },
      { status: 422 }
    )
  }

  try {
    const serverRes = await fetch(`${SERVER_URL}/free-tool/competitor-backlink-gap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": INTERNAL_API_KEY,
        "x-forwarded-client-ip": clientIp,
      },
      body: JSON.stringify({
        url: normalized,
        siteContext: {
          title: siteDetails.title,
          metaDescription: siteDetails.metaDescription,
          h1: siteDetails.h1,
          paragraphs: siteDetails.paragraphs,
        },
      }),
    })

    let data: unknown
    try {
      data = await serverRes.json()
    } catch {
      return NextResponse.json({ error: "Service unavailable. Please try again." }, { status: 503 })
    }
    return NextResponse.json(data, { status: serverRes.status })
  } catch {
    return NextResponse.json({ error: "Service unavailable. Please try again." }, { status: 503 })
  }
}
