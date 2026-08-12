import { type NextRequest, NextResponse } from "next/server"
import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"

export const maxDuration = 300

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
    FREE_TOOL_NAMES.backlinkOpportunityFinder,
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
    return NextResponse.json({ error: "Enter a valid website URL." }, { status: 400 })
  }

  let siteDetails
  try {
    siteDetails = await fetchSiteDetails(url)
  } catch {
    return NextResponse.json(
      { error: "Could not reach that URL. Check it and try again." },
      { status: 422 }
    )
  }

  const productName = siteDetails.title?.trim()
  if (!productName) {
    return NextResponse.json(
      { error: "Couldn't read your site's title. Try the canonical URL." },
      { status: 422 }
    )
  }

  let serverRes: Response
  try {
    serverRes = await fetch(`${SERVER_URL}/free-tool/backlink-opportunity-finder`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
        "x-forwarded-client-ip": ip,
      },
      body: JSON.stringify({
        url,
        productName,
        siteContext: {
          title: siteDetails.title,
          metaDescription: siteDetails.metaDescription,
          h1: siteDetails.h1,
          paragraphs: siteDetails.paragraphs,
        },
      }),
    })
  } catch {
    return NextResponse.json(
      { error: "Service unavailable. Please try again." },
      { status: 503, headers: { "X-RateLimit-Remaining": String(remaining) } }
    )
  }

  const data = await serverRes.json().catch(() => ({ error: "Analysis failed. Please try again." }))

  return NextResponse.json(data, {
    status: serverRes.status,
    headers: { "X-RateLimit-Remaining": String(remaining) },
  })
}
