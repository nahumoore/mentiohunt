// Pure diff logic for the link tracker's nightly sweep — no I/O. Given a
// tracked_links row's current state, its product (for own-domain/competitor
// matching), and a fresh /check-link result, decides what changed and how the
// row's scheduling/failure counters should move.
//
// The single rule every branch below is written to protect: a false "your
// link was removed" alert is worse than a late one. Transient fetch problems
// (timeouts, Cloudflare, 5xx) NEVER touch status or emit an event — only
// consecutive, confirmed observations do.

import { hostMatchesTarget, normalizeCompetitorDomains, normalizeDomainInput } from "../../helpers/link-tracker/domains.js"
import type { CheckLinkResult, LinkAnchor } from "../../helpers/link-tracker/check-link-client.js"
import { isHomepagePath, normalizeText, urlsMatch } from "../../helpers/link-tracker/url.js"
import type {
  LinkSnapshot,
  RecentCheckEntry,
  TrackedLinkEventDraft,
  TrackedLinkRow,
  TrackedLinkStatus,
} from "./types.js"

const REL_TOKENS = new Set(["nofollow", "ugc", "sponsored"])
const RECENT_CHECKS_MAX = 14
const MISSING_CONFIRM_THRESHOLD = 2
const FAILURE_CHECK_FAILED_THRESHOLD = 3
const FAILURE_BACKOFF_HOURS = [6, 24, 48, 72]
const HEALTHY_RECHECK_HOURS = 24
const UNCERTAIN_RECHECK_HOURS = 6
const HEALTHY_JITTER_MS = 90 * 60 * 1000

export type DetectChangesInput = {
  link: TrackedLinkRow
  product: { website_url: string; competitors: string[] | null }
  /** null = transport-level failure talking to the scraper — mapped to "fetch_failed", never to "removed". */
  result: CheckLinkResult | null
  now?: Date
}

export type DetectChangesOutput = {
  nextStatus: TrackedLinkStatus
  events: TrackedLinkEventDraft[]
  observed: {
    observed_href: string | null
    observed_anchor_text: string | null
    observed_rel: string[]
    observed_http_status: number | null
    observed_final_url: string | null
  }
  firstSeen: {
    first_seen_href: string | null
    first_seen_anchor_text: string | null
    first_seen_rel: string[] | null
    first_seen_at: string | null
  }
  consecutiveFailures: number
  consecutiveMissing: number
  lastOkAt: string | null
  lastCheckedAt: string
  nextCheckAt: string
  recentChecks: RecentCheckEntry[]
  issueSince: string | null
}

function snapshotOf(link: TrackedLinkRow): LinkSnapshot {
  return {
    href: link.observed_href,
    anchor_text: link.observed_anchor_text,
    rel: link.observed_rel,
    status: link.status,
    http_status: link.observed_http_status,
  }
}

function pushRecentCheck(existing: RecentCheckEntry[], entry: RecentCheckEntry): RecentCheckEntry[] {
  return [entry, ...existing].slice(0, RECENT_CHECKS_MAX)
}

function failureBackoffMs(consecutiveFailures: number): number {
  const idx = Math.min(Math.max(consecutiveFailures - 1, 0), FAILURE_BACKOFF_HOURS.length - 1)
  return FAILURE_BACKOFF_HOURS[idx]! * 60 * 60 * 1000
}

function withHours(now: Date, hours: number, jitterMs = 0): string {
  const jitter = jitterMs > 0 ? Math.floor(Math.random() * jitterMs) : 0
  return new Date(now.getTime() + hours * 60 * 60 * 1000 + jitter).toISOString()
}

/**
 * Pick which of the scraper's matched anchors is "the" tracked link, in
 * priority order — pages routinely carry nav + footer + in-content links to
 * the same domain, so the first match isn't reliable on its own.
 */
function pickMatchedAnchor(
  targetLinks: LinkAnchor[],
  link: TrackedLinkRow
): LinkAnchor | null {
  if (targetLinks.length === 0) return null

  if (link.expected_target_url) {
    const exact = targetLinks.find((a) => urlsMatch(a.href, link.expected_target_url))
    if (exact) return exact
  }

  if (link.observed_anchor_text) {
    const normalizedObserved = normalizeText(link.observed_anchor_text)
    const byText = targetLinks.find((a) => normalizeText(a.anchor_text) === normalizedObserved)
    if (byText) return byText
  }

  if (link.observed_href) {
    const exact = targetLinks.find((a) => urlsMatch(a.href, link.observed_href))
    if (exact) return exact
  }

  const nonHomepage = targetLinks.find((a) => !isHomepagePath(a.href))
  if (nonHomepage) return nonHomepage

  return targetLinks[0]!
}

function relSetDiff(previous: string[] | null, next: string[]): { added: string[]; removed: string[] } {
  const prevSet = new Set((previous ?? []).filter((t) => REL_TOKENS.has(t)))
  const nextSet = new Set(next.filter((t) => REL_TOKENS.has(t)))
  return {
    added: [...nextSet].filter((t) => !prevSet.has(t)),
    removed: [...prevSet].filter((t) => !nextSet.has(t)),
  }
}

export function detectChanges({ link, product, result, now = new Date() }: DetectChangesInput): DetectChangesOutput {
  const events: TrackedLinkEventDraft[] = []
  const nowIso = now.toISOString()
  const isFirstEverCheck = link.first_seen_at === null

  // ---- Transport-level failure: never distinguishable from cf_blocked/http_error to the caller. ----
  const outcome = result?.outcome ?? "fetch_failed"

  if (outcome === "dead") {
    const consecutiveMissing = link.consecutive_missing + 1
    const confirmed = consecutiveMissing >= MISSING_CONFIRM_THRESHOLD || isFirstEverCheck
    let nextStatus = link.status
    let issueSince = link.issue_since

    if (confirmed && link.status !== "page_dead") {
      nextStatus = "page_dead"
      issueSince = link.issue_since ?? nowIso
      events.push({
        change_type: "source_page_dead",
        previous: snapshotOf(link),
        current: {
          href: null,
          anchor_text: null,
          rel: null,
          status: "page_dead",
          http_status: result?.status_code ?? null,
          initial: isFirstEverCheck,
        },
        preNotified: isFirstEverCheck,
      })
    }

    return {
      nextStatus,
      events,
      observed: unchangedObserved(link),
      firstSeen: unchangedFirstSeen(link),
      consecutiveFailures: 0,
      consecutiveMissing: confirmed ? 0 : consecutiveMissing,
      lastOkAt: link.last_ok_at,
      lastCheckedAt: nowIso,
      nextCheckAt: withHours(now, confirmed ? HEALTHY_RECHECK_HOURS : UNCERTAIN_RECHECK_HOURS, HEALTHY_JITTER_MS),
      recentChecks: pushRecentCheck(link.recent_checks, { at: nowIso, outcome: "dead", status_code: result?.status_code ?? null }),
      issueSince,
    }
  }

  const totalLinksZero = outcome === "ok" && (result?.total_links ?? 0) === 0
  if (outcome === "cf_blocked" || outcome === "http_error" || outcome === "fetch_failed" || totalLinksZero) {
    const consecutiveFailures = link.consecutive_failures + 1
    const crossedThreshold = consecutiveFailures === FAILURE_CHECK_FAILED_THRESHOLD
    const nextStatus: TrackedLinkStatus = consecutiveFailures >= FAILURE_CHECK_FAILED_THRESHOLD ? "check_failed" : link.status

    if (crossedThreshold) {
      events.push({
        change_type: "check_failed_persistent",
        previous: snapshotOf(link),
        current: { href: null, anchor_text: null, rel: null, status: "check_failed", http_status: result?.status_code ?? null },
      })
    }

    return {
      nextStatus,
      events,
      observed: unchangedObserved(link),
      firstSeen: unchangedFirstSeen(link),
      consecutiveFailures,
      consecutiveMissing: link.consecutive_missing,
      lastOkAt: link.last_ok_at,
      lastCheckedAt: nowIso,
      nextCheckAt: new Date(now.getTime() + failureBackoffMs(consecutiveFailures)).toISOString(),
      recentChecks: pushRecentCheck(link.recent_checks, {
        at: nowIso,
        outcome: totalLinksZero ? "fetch_failed" : outcome,
        status_code: result?.status_code ?? null,
      }),
      issueSince: link.issue_since,
    }
  }

  // ---- outcome === "ok" and total_links > 0 from here on. ----
  const checkResult = result!
  const recentChecks = pushRecentCheck(link.recent_checks, { at: nowIso, outcome: "ok", status_code: checkResult.status_code })

  if (
    checkResult.final_url &&
    checkResult.final_url !== link.observed_final_url &&
    !urlsMatch(checkResult.final_url, link.source_url)
  ) {
    events.push({
      change_type: "source_page_redirected",
      previous: { href: null, anchor_text: null, rel: null, status: link.status, http_status: null },
      current: { href: checkResult.final_url, anchor_text: null, rel: null, status: link.status, http_status: checkResult.status_code },
    })
  }

  const matched = pickMatchedAnchor(checkResult.target_links, link)

  if (!matched) {
    const consecutiveMissing = link.consecutive_missing + 1
    const confirmed = consecutiveMissing >= MISSING_CONFIRM_THRESHOLD || isFirstEverCheck

    if (!confirmed) {
      return {
        nextStatus: link.status,
        events,
        observed: unchangedObserved(link),
        firstSeen: unchangedFirstSeen(link),
        consecutiveFailures: 0,
        consecutiveMissing,
        lastOkAt: link.last_ok_at,
        lastCheckedAt: nowIso,
        nextCheckAt: withHours(now, UNCERTAIN_RECHECK_HOURS),
        recentChecks,
        issueSince: link.issue_since,
      }
    }

    const normalizedObserved = normalizeText(link.observed_anchor_text)
    const competitorMatch = normalizedObserved
      ? checkResult.competitor_links.find((c) => normalizeText(c.anchor_text) === normalizedObserved)
      : undefined
    const competitorDomainsFound = [...new Set(checkResult.competitor_links.map((c) => c.domain))]

    events.push({
      change_type: competitorMatch ? "target_now_competitor" : "link_removed",
      previous: snapshotOf(link),
      current: {
        href: competitorMatch?.href ?? null,
        anchor_text: null,
        rel: null,
        status: "removed",
        http_status: checkResult.status_code,
        competitor_domains: competitorDomainsFound.length > 0 ? competitorDomainsFound : undefined,
        initial: isFirstEverCheck,
      },
      preNotified: isFirstEverCheck,
    })

    return {
      nextStatus: "removed",
      events,
      observed: unchangedObserved(link),
      firstSeen: unchangedFirstSeen(link),
      consecutiveFailures: 0,
      consecutiveMissing: 0,
      lastOkAt: link.last_ok_at,
      lastCheckedAt: nowIso,
      nextCheckAt: withHours(now, HEALTHY_RECHECK_HOURS, HEALTHY_JITTER_MS),
      recentChecks,
      issueSince: link.issue_since ?? nowIso,
    }
  }

  // ---- Matched: link is present. ----
  const wasIssue = link.status === "removed" || link.status === "page_dead" || link.status === "check_failed"
  if (wasIssue) {
    events.push({
      change_type: "link_restored",
      previous: snapshotOf(link),
      current: {
        href: matched.href,
        anchor_text: matched.anchor_text,
        rel: matched.rel_tokens,
        status: "live",
        http_status: checkResult.status_code,
      },
    })
    if (link.status === "page_dead") {
      events.push({
        change_type: "source_page_recovered",
        previous: snapshotOf(link),
        current: { href: matched.href, anchor_text: null, rel: null, status: "live", http_status: checkResult.status_code },
      })
    }
  }

  const { added: relAdded, removed: relRemoved } = relSetDiff(link.observed_rel, matched.rel_tokens)
  if (relAdded.length > 0) {
    events.push({
      change_type: "rel_added",
      previous: { href: matched.href, anchor_text: matched.anchor_text, rel: link.observed_rel, status: link.status, http_status: null },
      current: { href: matched.href, anchor_text: matched.anchor_text, rel: matched.rel_tokens, status: link.status, http_status: null },
    })
  } else if (relRemoved.length > 0) {
    events.push({
      change_type: "rel_removed",
      previous: { href: matched.href, anchor_text: matched.anchor_text, rel: link.observed_rel, status: link.status, http_status: null },
      current: { href: matched.href, anchor_text: matched.anchor_text, rel: matched.rel_tokens, status: link.status, http_status: null },
    })
  }

  const normalizedOldText = normalizeText(link.observed_anchor_text)
  const normalizedNewText = normalizeText(matched.anchor_text)
  if (!wasIssue && !matched.is_image_link && normalizedOldText && normalizedNewText && normalizedOldText !== normalizedNewText) {
    events.push({
      change_type: "anchor_changed",
      previous: { href: matched.href, anchor_text: link.observed_anchor_text, rel: null, status: link.status, http_status: null },
      current: { href: matched.href, anchor_text: matched.anchor_text, rel: null, status: link.status, http_status: null },
    })
  }

  const targetReference = link.expected_target_url ?? link.observed_href
  const hrefChanged = !wasIssue && !isFirstEverCheck && targetReference !== null && !urlsMatch(matched.href, targetReference)
  if (hrefChanged) {
    events.push({
      change_type: "target_url_changed",
      previous: { href: link.observed_href, anchor_text: matched.anchor_text, rel: null, status: link.status, http_status: null },
      current: { href: matched.href, anchor_text: matched.anchor_text, rel: null, status: link.status, http_status: null },
    })
  }

  const nextStatus: TrackedLinkStatus = matched.rel_tokens.length > 0 ? "nofollow" : hrefChanged ? "target_changed" : "live"

  const firstSeen = isFirstEverCheck
    ? {
        first_seen_href: matched.href,
        first_seen_anchor_text: matched.anchor_text,
        first_seen_rel: matched.rel_tokens,
        first_seen_at: nowIso,
      }
    : unchangedFirstSeen(link)

  return {
    nextStatus,
    events,
    observed: {
      observed_href: matched.href,
      observed_anchor_text: matched.anchor_text,
      observed_rel: matched.rel_tokens,
      observed_http_status: checkResult.status_code,
      observed_final_url: checkResult.final_url,
    },
    firstSeen,
    consecutiveFailures: 0,
    consecutiveMissing: 0,
    lastOkAt: nowIso,
    lastCheckedAt: nowIso,
    nextCheckAt: withHours(now, HEALTHY_RECHECK_HOURS, HEALTHY_JITTER_MS),
    recentChecks,
    issueSince: wasIssue ? null : link.issue_since,
  }
}

function unchangedObserved(link: TrackedLinkRow) {
  return {
    observed_href: link.observed_href,
    observed_anchor_text: link.observed_anchor_text,
    observed_rel: link.observed_rel,
    observed_http_status: link.observed_http_status,
    observed_final_url: link.observed_final_url,
  }
}

function unchangedFirstSeen(link: TrackedLinkRow) {
  return {
    first_seen_href: link.first_seen_href,
    first_seen_anchor_text: link.first_seen_anchor_text,
    first_seen_rel: link.first_seen_rel,
    first_seen_at: link.first_seen_at,
  }
}

/** Resolve the target domain (own site) fetch_page/checkLink should match anchors against. */
export function ownTargetDomain(websiteUrl: string): string {
  return normalizeDomainInput(websiteUrl) ?? websiteUrl
}

export function competitorDomainsFor(product: { competitors: string[] | null }): string[] {
  return normalizeCompetitorDomains(product.competitors)
}

export { hostMatchesTarget }
