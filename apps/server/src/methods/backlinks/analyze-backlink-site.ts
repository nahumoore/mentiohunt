import { getDomainRating } from "../../helpers/ahrefs/get-domain-rating.js"
import { getBacklinksSummary } from "../../helpers/data-for-seo/get-backlinks-summary.js"
import { getBulkTrafficEstimation } from "../../helpers/data-for-seo/get-bulk-traffic-estimation.js"
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

export async function analyzeBacklinkSite({
  url,
}: {
  url: string
}): Promise<BacklinkSiteMetrics> {
  const domain = normalizeDomain(url)
  const canonicalUrl = `https://${domain}`

  log.info("analyzing site", { domain })

  const [domainRatingResult, summaryResult, dofollowSummaryResult, trafficResult] = await Promise.allSettled([
    getDomainRating(canonicalUrl),
    getBacklinksSummary(domain),
    getBacklinksSummary(domain, { dofollowOnly: true }),
    getBulkTrafficEstimation([domain]),
  ])

  if (domainRatingResult.status === "rejected" || summaryResult.status === "rejected") {
    log.error("site metrics fetch failed", {
      domainRatingError:
        domainRatingResult.status === "rejected" ? String(domainRatingResult.reason) : null,
      summaryError: summaryResult.status === "rejected" ? String(summaryResult.reason) : null,
    })
    throw new Error("Could not fetch authority metrics. Try again later.")
  }

  let traffic: number | null = null
  if (trafficResult.status === "fulfilled") {
    traffic = trafficResult.value.trafficByTarget.get(domain) ?? null
  } else if (trafficResult.status === "rejected") {
    log.warn("traffic actor failed — degrading gracefully", {
      error: String(trafficResult.reason),
    })
  }

  let dofollowBacklinks: number | null = null
  let dofollowReferringDomains: number | null = null
  if (dofollowSummaryResult.status === "fulfilled") {
    dofollowBacklinks = dofollowSummaryResult.value.backlinks
    dofollowReferringDomains = dofollowSummaryResult.value.referringDomains
  } else {
    log.warn("dofollow summary failed — degrading gracefully", {
      error: String(dofollowSummaryResult.reason),
    })
  }

  const metrics: BacklinkSiteMetrics = {
    domain,
    domainRating: domainRatingResult.value,
    backlinks: summaryResult.value.backlinks,
    referringDomains: summaryResult.value.referringDomains,
    dofollowBacklinks,
    dofollowReferringDomains,
    traffic,
  }

  log.success("analysis complete", { ...metrics })

  return metrics
}
