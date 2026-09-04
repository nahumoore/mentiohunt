import { timingSafeEqual } from "node:crypto"
import { generateCompetitorDomains } from "../methods/competitor-domains/generate-competitors.js"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { parseSiteContext } from "../helpers/site-context.js"
import { extractBacklinks, extractCompetitorDomain } from "../methods/prospect-generation-methods/competitor-backlink/extract-backlinks.js"
import { filterBacklinks, type TaggedBacklinkItem } from "../methods/prospect-generation-methods/competitor-backlink/filter-backlinks.js"
import {
  scoreBacklinkRelevance,
  type PageType,
} from "../methods/prospect-generation-methods/competitor-backlink/score-backlink-relevance.js"
import { extractDomainFromUrl } from "../methods/prospect-generation-methods/shared/url-filters.js"
import { deriveProductProfile } from "../methods/site-profile/derive-product-profile.js"

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

const PAGE_TYPE_LABELS: Record<PageType, string> = {
  roundup: "Link Roundup",
  comparison: "Link Roundup",
  resource: "Resource Page",
  "brand-mention": "Blog Mention",
  other: "Niche Blog",
}

function domainToName(domain: string): string {
  const main = domain.split(".")[0] ?? domain
  return main.charAt(0).toUpperCase() + main.slice(1)
}

const MIN_DOMAIN_RATING = 20
const MAX_DOMAIN_RATING = 90
const MAX_GAPS_PER_COMPETITOR = 5
const MIN_RELEVANCE_SCORE = 3
const STRONG_FIT_SCORE = 4

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
  const siteContext = parseSiteContext((req.body as { siteContext?: unknown }).siteContext)

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
      const { domains: rawCompetitorDomains, confidence } = await generateCompetitorDomains(url)
      const competitorDomains = rawCompetitorDomains.map(extractCompetitorDomain)

      if (confidence === "low" || competitorDomains.length < 2) {
        log.info("low-confidence competitor identification, declining to guess", {
          hostname,
          competitorDomains,
          confidence,
        })
        res.status(422).json({
          error: "We couldn't confidently identify competitors from that page. Try your main marketing URL.",
          code: "low_confidence",
        })
        return
      }

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
      const filtered = filterBacklinks(
        allTagged,
        { dr_min: MIN_DOMAIN_RATING, dr_max: MAX_DOMAIN_RATING },
        hostname
      )

      const { profile } = await deriveProductProfile({
        url,
        title: siteContext?.title,
        metaDescription: siteContext?.metaDescription,
        h1: siteContext?.h1,
        paragraphs: siteContext?.paragraphs,
      })

      const { results: scored } = await scoreBacklinkRelevance(filtered, {
        product_name: profile.productName,
        product_description: profile.productDescription,
      })

      const relevant = scored.filter((item) => item.relevanceScore >= MIN_RELEVANCE_SCORE)

      const byCompetitor = new Map<string, typeof relevant>()
      for (const item of relevant) {
        const group = byCompetitor.get(item.competitorDomain) ?? []
        group.push(item)
        byCompetitor.set(item.competitorDomain, group)
      }

      let highPriority = 0
      const responseCompetitors = competitorDomains.map((domain, i) => {
        const items = (byCompetitor.get(domain) ?? [])
          .sort((a, b) => b.relevanceScore - a.relevanceScore || b.domainRating - a.domainRating)
          .slice(0, MAX_GAPS_PER_COMPETITOR)

        const gaps = items.map((item, j) => {
          if (item.relevanceScore >= STRONG_FIT_SCORE) highPriority += 1
          return {
            id: `${i + 1}-${j + 1}`,
            domain: extractDomainFromUrl(item.urlFrom),
            name: item.title || null,
            da: item.domainRating,
            url: item.urlFrom,
            type: PAGE_TYPE_LABELS[item.pageType],
            reason: item.relevanceReason,
          }
        })

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

      log.info("done", {
        hostname,
        competitorCount: competitorDomains.length,
        pagesExamined: filtered.length,
        pagesScored: scored.length,
        totalGaps,
      })

      res.json({
        competitors: responseCompetitors,
        summary: {
          competitorsFound: responseCompetitors.filter((c) => c.gapCount > 0).length,
          pagesExamined: scored.length,
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
