import {
  AHREFS_AUTHORITY_CHECKER,
  type AhrefsAuthorityResult,
} from "../../helpers/actors/ahrefs-authority-checker.js"
import {
  AHREFS_SEO_TOOLS,
  AHREFS_TRAFFIC_SEARCH_TYPE,
} from "../../helpers/actors/ahrefs-seo-tools.js"
import { runApifyActor } from "../../helpers/actors/run-apify-actor.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("analyze-backlink-site")

export type BacklinkSiteMetrics = {
  domain: string
  domainRating: number | null
  backlinks: number | null
  referringDomains: number | null
  dofollowBacklinks: number | null
  dofollowReferringDomains: number | null
  traffic: number | null
}

function normalizeDomain(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string") return null
  const parsed = Number.parseFloat(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

function extractTrafficFromItem(item: Record<string, unknown>): number | null {
  for (const [key, val] of Object.entries(item)) {
    if (/traffic/i.test(key)) {
      const n = toNumber(val as number | string | null)
      if (n !== null) return n
    }
  }
  return null
}

export async function analyzeBacklinkSite({
  url,
}: {
  url: string
}): Promise<BacklinkSiteMetrics> {
  const domain = normalizeDomain(url)
  const canonicalUrl = `https://${domain}`

  log.info("analyzing site", { domain })

  const [authorityResult, trafficResult] = await Promise.allSettled([
    runApifyActor<AhrefsAuthorityResult[]>(AHREFS_AUTHORITY_CHECKER, {
      start_urls: [{ url: canonicalUrl }],
    }),
    runApifyActor<Record<string, unknown>[]>(AHREFS_SEO_TOOLS, {
      searchType: AHREFS_TRAFFIC_SEARCH_TYPE,
      target: domain,
    }),
  ])

  if (authorityResult.status === "rejected") {
    log.error("authority actor failed", {
      error: String(authorityResult.reason),
    })
    throw new Error("Could not fetch authority metrics. Try again later.")
  }

  const items = authorityResult.value
  const item =
    items.find((r) => !r.error && (r.normalized_url || r.url)) ?? items[0]

  if (!item || item.error) {
    log.warn("authority actor returned error", { item })
    throw new Error(
      item?.error ?? "No authority data returned for this domain."
    )
  }

  let traffic: number | null = null
  if (
    trafficResult.status === "fulfilled" &&
    Array.isArray(trafficResult.value) &&
    trafficResult.value.length > 0
  ) {
    const firstItem = trafficResult.value[0]
    if (firstItem !== undefined) {
      traffic = extractTrafficFromItem(firstItem)
      log.info("traffic result", { traffic, raw: firstItem })
    }
  } else if (trafficResult.status === "rejected") {
    log.warn("traffic actor failed — degrading gracefully", {
      error: String(trafficResult.reason),
    })
  }

  const metrics: BacklinkSiteMetrics = {
    domain,
    domainRating: toNumber(item.domainRating),
    backlinks: toNumber(item.backlinks),
    referringDomains: toNumber(item.refdomains),
    dofollowBacklinks: toNumber(item.dofollowBacklinks),
    dofollowReferringDomains: toNumber(item.dofollowRefdomains),
    traffic,
  }

  log.success("analysis complete", { ...metrics })

  return metrics
}
