import { supabaseAdmin } from "@workspace/supabase/admin"
import { checkLink } from "../../helpers/link-tracker/check-link-client.js"
import { createLogger } from "../../helpers/logger.js"
import { competitorDomainsFor, detectChanges, ownTargetDomain } from "./detect-changes.js"
import type { TrackedLinkRow } from "./types.js"

const log = createLogger("link-tracker")

export type CheckTrackedLinkProduct = { website_url: string; competitors: string[] | null }

export type CheckTrackedLinkResult = {
  trackedLinkId: string
  status: TrackedLinkRow["status"]
  eventsCreated: number
}

/**
 * Re-checks one tracked link end to end: calls the scraper, runs the pure
 * diff, then writes the updated row + any new events in one pass. Callers
 * that already have the product row loaded (the nightly sweep, batching
 * many links per product) should pass it in directly; checkTrackedLinkById
 * below is the single-link convenience wrapper for the "check on submit"
 * path, where only a trackedLinkId is known.
 */
export async function checkTrackedLink(
  link: TrackedLinkRow,
  product: CheckTrackedLinkProduct,
  options: { forceDynamic?: boolean } = {}
): Promise<CheckTrackedLinkResult> {
  const targetDomain = ownTargetDomain(product.website_url)
  const competitorDomains = competitorDomainsFor(product)

  const result = await checkLink({
    url: link.source_url,
    targetDomain,
    competitorDomains,
    forceDynamic: options.forceDynamic,
  })

  const diff = detectChanges({ link, product, result })

  const { error: updateError } = await supabaseAdmin
    .from("tracked_links")
    .update({
      status: diff.nextStatus,
      issue_since: diff.issueSince,
      observed_href: diff.observed.observed_href,
      observed_anchor_text: diff.observed.observed_anchor_text,
      observed_rel: diff.observed.observed_rel,
      observed_http_status: diff.observed.observed_http_status,
      observed_final_url: diff.observed.observed_final_url,
      first_seen_href: diff.firstSeen.first_seen_href,
      first_seen_anchor_text: diff.firstSeen.first_seen_anchor_text,
      first_seen_rel: diff.firstSeen.first_seen_rel,
      first_seen_at: diff.firstSeen.first_seen_at,
      last_checked_at: diff.lastCheckedAt,
      last_ok_at: diff.lastOkAt,
      next_check_at: diff.nextCheckAt,
      consecutive_failures: diff.consecutiveFailures,
      consecutive_missing: diff.consecutiveMissing,
      recent_checks: diff.recentChecks,
      updated_at: new Date().toISOString(),
    })
    .eq("id", link.id)

  if (updateError) {
    log.error("failed to update tracked link", { trackedLinkId: link.id, error: updateError.message })
    throw new Error(`failed to update tracked link ${link.id}: ${updateError.message}`)
  }

  if (diff.events.length > 0) {
    const nowIso = new Date().toISOString()
    const { error: eventsError } = await supabaseAdmin.from("tracked_link_events").insert(
      diff.events.map((event) => ({
        tracked_link_id: link.id,
        product_id: link.product_id,
        change_type: event.change_type,
        previous: event.previous,
        current: event.current,
        // Pre-stamped so the "first check finds nothing" fast path never
        // reaches the digest — it's almost always a bad submitted URL, not a
        // real removal, and surfaces inline in the UI instead.
        notified_at: event.preNotified ? nowIso : null,
      }))
    )

    if (eventsError) {
      log.error("failed to insert tracked link events", { trackedLinkId: link.id, error: eventsError.message })
      throw new Error(`failed to insert events for tracked link ${link.id}: ${eventsError.message}`)
    }

    log.info("tracked link changed", {
      trackedLinkId: link.id,
      productId: link.product_id,
      status: diff.nextStatus,
      changeTypes: diff.events.map((e) => e.change_type),
    })
  }

  return { trackedLinkId: link.id, status: diff.nextStatus, eventsCreated: diff.events.length }
}

/** Single-link convenience wrapper — loads the link + its product, then delegates to checkTrackedLink. */
export async function checkTrackedLinkById(
  trackedLinkId: string,
  options: { forceDynamic?: boolean } = {}
): Promise<CheckTrackedLinkResult | null> {
  const { data: link, error: linkError } = await supabaseAdmin
    .from("tracked_links")
    .select("*")
    .eq("id", trackedLinkId)
    .single()

  if (linkError || !link) {
    log.warn("tracked link not found", { trackedLinkId, error: linkError?.message })
    return null
  }

  const row = link as unknown as TrackedLinkRow

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("website_url, competitors")
    .eq("id", row.product_id)
    .single()

  if (productError || !product) {
    log.warn("product not found for tracked link", { trackedLinkId, productId: row.product_id, error: productError?.message })
    return null
  }

  return checkTrackedLink(row, { website_url: product.website_url, competitors: product.competitors ?? null }, options)
}
