import { type NextRequest, NextResponse } from "next/server"
import { checkFreeToolRateLimit, FREE_TOOL_NAMES } from "@/consts/free-tools"
import { normalizeUrl } from "@/consts/onboarding"
import { fetchSiteDetails } from "@/lib/onboarding/fetch-site"
import { findBrokenLinksOnPage } from "@/lib/free-tools/check-broken-links"

export const maxDuration = 300

const SERVER_URL = process.env.SERVER_URL ?? "http://localhost:3001"
const MAX_PAGES_SCANNED = 10
const PAGE_SCAN_CONCURRENCY = 4

type BrokenLinkCandidate = {
  id: string
  domain: string
  url: string
  title: string
  snippet: string
  matchedQuery: string
  matchedFootprint: string
}

type BrokenLinkOpportunity = {
  id: string
  domain: string
  name: string
  url: string
  score: number
  matchedFootprint: string
  brokenLinks: { url: string; anchorText: string; reason: string }[]
}

function getIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  )
}

function scoreOpportunity(brokenLinkCount: number): number {
  return Math.min(95, 35 + brokenLinkCount * 20)
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let cursor = 0

  async function worker() {
    while (cursor < items.length) {
      const index = cursor
      cursor += 1
      results[index] = await fn(items[index] as T)
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, worker))
  return results
}

export async function POST(req: NextRequest) {
  const ip = getIp(req)
  const { allowed, remaining } = checkFreeToolRateLimit(
    FREE_TOOL_NAMES.brokenLinkFinder,
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

  const siteContext = {
    title: siteDetails.title,
    metaDescription: siteDetails.metaDescription,
    h1: siteDetails.h1,
    paragraphs: siteDetails.paragraphs,
  }

  const serverRes = await fetch(`${SERVER_URL}/find-broken-link-candidates-by-url`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-internal-api-key": process.env.INTERNAL_API_KEY ?? "",
      "x-forwarded-client-ip": ip,
    },
    body: JSON.stringify({ url, productName, siteContext }),
  })

  if (!serverRes.ok) {
    const errorData = await serverRes.json().catch(() => ({}))
    return NextResponse.json(errorData, {
      status: serverRes.status,
      headers: { "X-RateLimit-Remaining": String(remaining) },
    })
  }

  const discovery = (await serverRes.json()) as {
    niches: string[]
    queriesRun: number
    candidates: BrokenLinkCandidate[]
  }

  const candidatesToScan = discovery.candidates.slice(0, MAX_PAGES_SCANNED)

  const scanned = await mapWithConcurrency(
    candidatesToScan,
    PAGE_SCAN_CONCURRENCY,
    async (candidate) => {
      try {
        const { brokenLinks } = await findBrokenLinksOnPage(candidate.url)
        return { candidate, brokenLinks }
      } catch {
        return { candidate, brokenLinks: [] }
      }
    }
  )

  const opportunities: BrokenLinkOpportunity[] = scanned
    .filter((entry) => entry.brokenLinks.length > 0)
    .map(({ candidate, brokenLinks }) => ({
      id: candidate.id,
      domain: candidate.domain,
      name: candidate.title || candidate.domain,
      url: candidate.url,
      score: scoreOpportunity(brokenLinks.length),
      matchedFootprint: candidate.matchedFootprint,
      brokenLinks: brokenLinks.map((link) => ({
        url: link.url,
        anchorText: link.anchorText,
        reason: link.reason,
      })),
    }))
    .sort((a, b) => b.brokenLinks.length - a.brokenLinks.length)

  return NextResponse.json(
    {
      niches: discovery.niches,
      pagesScanned: candidatesToScan.length,
      opportunities,
      summary: {
        candidatesFound: discovery.candidates.length,
        pagesScanned: candidatesToScan.length,
        withBrokenLinks: opportunities.length,
      },
    },
    { status: 200, headers: { "X-RateLimit-Remaining": String(remaining) } }
  )
}
