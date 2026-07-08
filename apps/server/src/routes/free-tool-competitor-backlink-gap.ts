import { timingSafeEqual } from "node:crypto"
import { generateCompetitorDomains } from "../methods/competitor-backlinks/generate-competitors.js"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { extractBacklinks, extractCompetitorDomain } from "../methods/competitor-backlinks/extract-backlinks.js"
import { filterBacklinks, type TaggedBacklinkItem } from "../methods/competitor-backlinks/filter-backlinks.js"
import { extractDomainFromUrl } from "../methods/shared/url-filters.js"

const log = createLogger("free-tool-competitor-backlink-gap")

export const freeToolCompetitorBacklinkGapRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function inferType(url: string): string {
  try {
    const path = new URL(url).pathname.toLowerCase()
    if (path.includes("/resource") || path.includes("/tool") || path.includes("/best-") || path.includes("/top-")) {
      return "Resource Page"
    }
    if (path.includes("/roundup") || path.includes("-list") || path.includes("-tools")) {
      return "Link Roundup"
    }
    if (path.includes("/blog/") || path.includes("/article") || path.includes("/post")) {
      return "Blog Mention"
    }
    return "Niche Blog"
  } catch {
    return "Niche Blog"
  }
}

function domainToName(domain: string): string {
  const main = domain.split(".")[0] ?? domain
  return main.charAt(0).toUpperCase() + main.slice(1)
}

const MIN_DOMAIN_RATING = 20
const MAX_DOMAIN_RATING = 65
const MAX_GAPS_PER_COMPETITOR = 5

freeToolCompetitorBacklinkGapRouter.post("/free-tool/competitor-backlink-gap", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("free-tool-competitor-backlink-gap", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const { url } = req.body as { url?: string }

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url required" })
    return
  }

  let hostname: string
  try {
    hostname = new URL(url.startsWith("http") ? url : `https://${url}`).hostname
  } catch {
    res.status(400).json({ error: "invalid url" })
    return
  }

  await withRouteLog(`free-tool-competitor-backlink-gap-${hostname}`, async () => {
    log.info("starting", { hostname })

    try {
      const competitorDomains = (await generateCompetitorDomains(url)).map(
        extractCompetitorDomain
      )

      const extracted = await Promise.all(
        competitorDomains.map(async (domain) => {
          const { items } = await extractBacklinks(domain, {
            dr_min: MIN_DOMAIN_RATING,
            dr_max: MAX_DOMAIN_RATING,
            mozCursor: null,
          })
          const tagged: TaggedBacklinkItem[] = items.map((item) => ({ ...item, competitorDomain: domain }))
          return { domain, tagged }
        })
      )

      const allTagged = extracted.flatMap((e) => e.tagged)
      const filtered = filterBacklinks(allTagged, {
        dr_min: MIN_DOMAIN_RATING,
        dr_max: MAX_DOMAIN_RATING,
      })

      const byCompetitor = new Map<string, TaggedBacklinkItem[]>()
      for (const item of filtered) {
        const group = byCompetitor.get(item.competitorDomain) ?? []
        group.push(item)
        byCompetitor.set(item.competitorDomain, group)
      }

      const responseCompetitors = competitorDomains.map((domain, i) => {
        const items = (byCompetitor.get(domain) ?? [])
          .sort((a, b) => b.domainRating - a.domainRating)
          .slice(0, MAX_GAPS_PER_COMPETITOR)

        const gaps = items.map((item, j) => ({
          id: `${i + 1}-${j + 1}`,
          domain: extractDomainFromUrl(item.urlFrom),
          name: item.title || null,
          da: item.domainRating,
          url: item.urlFrom,
          type: inferType(item.urlFrom),
          reason: null,
        }))

        return {
          id: String(i + 1),
          domain,
          name: domainToName(domain),
          da: null,
          totalBacklinks: 0,
          gapCount: gaps.length,
          gaps,
        }
      })

      const totalGaps = responseCompetitors.reduce((sum, c) => sum + c.gapCount, 0)
      const highPriority = responseCompetitors.reduce(
        (sum, c) =>
          sum +
          c.gaps.filter(
            (g) => g.da !== null && g.da >= MIN_DOMAIN_RATING && g.da <= MAX_DOMAIN_RATING
          ).length,
        0
      )

      log.info("done", { hostname, competitorCount: competitorDomains.length, totalGaps })

      res.json({
        competitors: responseCompetitors,
        summary: {
          competitorsFound: responseCompetitors.filter((c) => c.gapCount > 0).length,
          totalGaps,
          highPriority,
        },
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { hostname, error: msg })
      res.status(502).json({ error: "Analysis failed. Please try again." })
    }
  })
})
