import { supabaseAdmin } from "@workspace/supabase/admin"
import { canSendAlerts } from "../helpers/emails/should-send-alerts.js"
import { sendLinkTrackerDigestEmail, type DigestChange } from "../helpers/emails/send-link-tracker-digest.js"
import { createLogger } from "../helpers/logger.js"
import { createNotification } from "../helpers/notifications/create-notification.js"
import type { LinkSnapshot, TrackedLinkChangeType } from "../methods/link-tracker/types.js"

const log = createLogger("link-tracker-digest")

// Recoveries are good news, not something worth a bell notification — only
// the transitions that need the user's attention count toward the badge.
const RECOVERY_CHANGE_TYPES = new Set<TrackedLinkChangeType>([
  "link_restored",
  "rel_removed",
  "source_page_recovered",
])

type RawEvent = {
  id: string
  tracked_link_id: string
  product_id: string
  change_type: TrackedLinkChangeType
  previous: LinkSnapshot | null
  current: LinkSnapshot | null
}

type LinkInfo = { id: string; source_url: string; label: string | null }

/**
 * One email per user, covering every product with unnotified events. Runs
 * after both the morning sweep and the afternoon confirmation pass (17:00
 * UTC cron, see jobs/index.ts) so a same-day removal is never split across
 * two emails. Dedupe is structural: events only exist on a state transition,
 * so an unresolved issue is included exactly once — notified_at is stamped
 * only after a successful send, so a Resend outage leaves events unnotified
 * for the next run instead of silently losing them.
 */
export async function sendTrackedLinkDigests(): Promise<void> {
  log.info("starting")

  const { data: events, error: eventsError } = await supabaseAdmin
    .from("tracked_link_events")
    .select("id, tracked_link_id, product_id, change_type, previous, current")
    .is("notified_at", null)
    .order("detected_at", { ascending: true })
    .limit(5000)

  if (eventsError) {
    log.error("failed to load unnotified events", { error: eventsError.message })
    return
  }

  const rawEvents = (events ?? []) as unknown as RawEvent[]
  if (rawEvents.length === 0) {
    log.info("no unnotified events")
    return
  }

  const trackedLinkIds = [...new Set(rawEvents.map((e) => e.tracked_link_id))]
  const { data: links, error: linksError } = await supabaseAdmin
    .from("tracked_links")
    .select("id, source_url, label")
    .in("id", trackedLinkIds)

  if (linksError) {
    log.error("failed to load tracked links for digest", { error: linksError.message })
    return
  }

  const linkById = new Map(((links ?? []) as unknown as LinkInfo[]).map((l) => [l.id, l]))

  const productIds = [...new Set(rawEvents.map((e) => e.product_id))]
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name")
    .in("id", productIds)

  if (productsError) {
    log.error("failed to load products for digest", { error: productsError.message })
    return
  }

  const productById = new Map((products ?? []).map((p) => [p.id, p]))
  const userIds = [...new Set((products ?? []).map((p) => p.user_id))]

  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, email_settings")
    .in("id", userIds)

  if (profilesError) {
    log.error("failed to load profiles for digest", { error: profilesError.message })
    return
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p]))

  const eventsByUser = new Map<string, RawEvent[]>()
  for (const event of rawEvents) {
    const product = productById.get(event.product_id)
    if (!product) continue
    const list = eventsByUser.get(product.user_id) ?? []
    list.push(event)
    eventsByUser.set(product.user_id, list)
  }

  let usersSent = 0
  let usersSkipped = 0
  let usersDeferred = 0

  for (const [userId, userEvents] of eventsByUser) {
    const profile = profileById.get(userId)
    if (!profile?.email) {
      log.warn("no profile email, skipping digest", { userId })
      usersSkipped++
      continue
    }
    if (!canSendAlerts(profile)) {
      usersSkipped++
      continue
    }

    const userProductIds = [...new Set(userEvents.map((e) => e.product_id))]
    const { data: statusRows, error: statusError } = await supabaseAdmin
      .from("tracked_links")
      .select("status")
      .in("product_id", userProductIds)

    if (statusError) {
      log.warn("failed to load status counts for digest stats", { userId, error: statusError.message })
    }

    const statuses = ((statusRows ?? []) as unknown as Array<{ status: string }>).map((r) => r.status)
    const tracked = statuses.length
    const live = statuses.filter((s) => s === "live").length
    const needsAttention = statuses.filter((s) => s !== "live" && s !== "pending").length

    const changes: DigestChange[] = userEvents.map((event) => {
      const link = linkById.get(event.tracked_link_id)
      const product = productById.get(event.product_id)
      return {
        sourceUrl: link?.source_url ?? "(unknown page)",
        label: link?.label ?? null,
        changeType: event.change_type,
        previous: event.previous,
        current: event.current,
        productName: product?.product_name ?? "your product",
      }
    })

    const success = await sendLinkTrackerDigestEmail({
      to: profile.email,
      userId,
      userName: profile.name,
      changes,
      stats: { tracked, live, needsAttention },
    })

    if (!success) {
      log.warn("digest send failed, leaving events unnotified for next run", { userId, eventCount: userEvents.length })
      usersDeferred++
      continue
    }

    const eventIds = userEvents.map((e) => e.id)
    const { error: stampError } = await supabaseAdmin
      .from("tracked_link_events")
      .update({ notified_at: new Date().toISOString() })
      .in("id", eventIds)

    if (stampError) {
      log.error("failed to stamp notified_at after send", { userId, error: stampError.message })
      continue
    }

    const issueCount = userEvents.filter((event) => !RECOVERY_CHANGE_TYPES.has(event.change_type)).length
    if (issueCount > 0) {
      await createNotification({
        userId,
        type: "tracked_link_issue",
        title: issueCount === 1 ? "1 backlink issue detected" : `${issueCount} backlink issues detected`,
        body: "A tracked backlink changed and needs a look.",
        linkHref: "/dashboard/link-tracker",
      })
    }

    usersSent++
  }

  log.info("complete", { usersSent, usersSkipped, usersDeferred })
}
