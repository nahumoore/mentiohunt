import pLimit from "p-limit"
import { createLogger } from "../../../helpers/logger.js"
import { extractBacklinks, type BacklinkItem } from "../competitor-backlink/extract-backlinks.js"
import { checkDeadTarget } from "./check-dead-target.js"
import type { DeadLinkCandidate } from "./types.js"

const log = createLogger("extract-dead-targets")

const STATUS_CHECK_CONCURRENCY = 10

export type ExtractDeadTargetsResult = {
  candidates: DeadLinkCandidate[]
  nextCursor: string | null
  costUsd: number
}

/**
 * Fetches a competitor's backlink profile, collects the distinct dead-link
 * targets (`url_to`), status-checks each one once (not once per linking
 * page — many links share a target), and returns every linking page that
 * points at a confirmed-dead target.
 */
export async function extractDeadTargets(
  competitorDomain: string,
  filters: { dr_min: number; dr_max: number | null; mozCursor: string | null; limit?: number }
): Promise<ExtractDeadTargetsResult> {
  const { items: rawItems, nextCursor, costUsd } = await extractBacklinks(competitorDomain, filters)

  if (rawItems.length === 0) {
    return { candidates: [], nextCursor, costUsd }
  }

  const itemsByTarget = new Map<string, BacklinkItem[]>()
  for (const item of rawItems) {
    if (!item.urlTo || !item.urlFrom) continue
    const group = itemsByTarget.get(item.urlTo) ?? []
    group.push(item)
    itemsByTarget.set(item.urlTo, group)
  }

  const distinctTargets = [...itemsByTarget.keys()]
  const limit = pLimit(STATUS_CHECK_CONCURRENCY)
  const checks = await Promise.all(
    distinctTargets.map((target) => limit(async () => ({ target, check: await checkDeadTarget(target) })))
  )

  const candidates: DeadLinkCandidate[] = []
  let deadCount = 0
  let soft404Count = 0

  for (const { target, check } of checks) {
    if (check.status === "soft_404") {
      soft404Count++
      log.info("soft-404 detected, not acted on in v1", { target, reason: check.reason })
      continue
    }
    if (check.status !== "dead" && check.status !== "redirect_dead") continue

    deadCount++
    // For a hard 404/410, httpStatus is the meaningful signal. For a
    // redirect-away, httpStatus is the landing page's own status (often
    // 200) and would misrepresent the dead link as working — use the
    // "redirected" sentinel instead.
    const deadUrlStatus = check.status === "redirect_dead" ? ("redirected" as const) : check.httpStatus
    for (const item of itemsByTarget.get(target) ?? []) {
      candidates.push({
        urlFrom: item.urlFrom,
        competitorDomain,
        deadUrl: target,
        deadUrlStatus,
        anchor: item.anchor,
        domainRating: item.domainRating,
        title: item.title,
        textPre: item.textPre,
        textPost: item.textPost,
      })
    }
  }

  log.info("dead target check complete", {
    competitorDomain,
    backlinksFetched: rawItems.length,
    distinctTargets: distinctTargets.length,
    deadTargets: deadCount,
    soft404Targets: soft404Count,
    linkingCandidates: candidates.length,
  })

  return { candidates, nextCursor, costUsd }
}
