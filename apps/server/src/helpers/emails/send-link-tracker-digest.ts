import type { TrackedLinkChangeType, LinkSnapshot } from "../../methods/link-tracker/types.js"
import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard } from "./base.js"

export type DigestChange = {
  sourceUrl: string
  label: string | null
  changeType: TrackedLinkChangeType
  previous: LinkSnapshot | null
  current: LinkSnapshot | null
  productName: string
}

// Worst-news-first — a user skimming the email should see "link removed"
// before "nofollow removed (that's actually good)".
const SEVERITY_ORDER: TrackedLinkChangeType[] = [
  "target_now_competitor",
  "link_removed",
  "source_page_dead",
  "rel_added",
  "target_url_changed",
  "anchor_changed",
  "source_page_redirected",
  "check_failed_persistent",
  "rel_removed",
  "source_page_recovered",
  "link_restored",
]

const SECTION_TITLES: Record<TrackedLinkChangeType, string> = {
  target_now_competitor: "Now links to a competitor",
  link_removed: "Links removed",
  source_page_dead: "Source page is down",
  rel_added: "Now nofollow",
  target_url_changed: "Target URL changed",
  anchor_changed: "Anchor text changed",
  source_page_redirected: "Source page redirected",
  check_failed_persistent: "Couldn't verify",
  rel_removed: "Nofollow removed",
  source_page_recovered: "Source page back up",
  link_restored: "Link restored",
}

// Careful phrasing: a page returning 200 with a "not found" body, or a page
// where an A/B test hid the link, both read as "no link found" — we can't
// prove the publisher removed it on purpose, so we never assert that.
function describeChange(change: DigestChange): string {
  const { changeType, previous, current } = change
  switch (changeType) {
    case "link_removed":
      return `We couldn't find your link on this page anymore${previous?.anchor_text ? ` (was linked as "${escapeHtml(previous.anchor_text)}")` : ""}.`
    case "target_now_competitor":
      return `This page dropped your link and now links to ${escapeHtml(current?.competitor_domains?.[0] ?? current?.href ?? "a competitor")} instead.`
    case "source_page_dead":
      return `The page itself now returns${current?.http_status ? ` a ${current.http_status}` : " an error"} — it looks like it was taken down.`
    case "rel_added":
      return `Your link is still there but is now marked ${escapeHtml((current?.rel ?? []).join(", ") || "nofollow")}.`
    case "rel_removed":
      return "Good news — the nofollow tag was removed from your link."
    case "target_url_changed":
      return `Your link now points to ${escapeHtml(current?.href ?? "a different URL")} instead of ${escapeHtml(previous?.href ?? "the original page")}.`
    case "anchor_changed":
      return `Anchor text changed from "${escapeHtml(previous?.anchor_text ?? "")}" to "${escapeHtml(current?.anchor_text ?? "")}".`
    case "source_page_redirected":
      return `The page now redirects to ${escapeHtml(current?.href ?? "a new URL")}.`
    case "check_failed_persistent":
      return "We haven't been able to verify this link for a few days in a row (the site may be blocking automated checks)."
    case "source_page_recovered":
      return "The source page is back online."
    case "link_restored":
      return "Good news — your link is back."
    default:
      return "Something changed."
  }
}

function renderChangeRow(change: DigestChange): string {
  const prefix = change.label ? `${escapeHtml(change.label)} — ` : ""
  return `
    <tr>
      <td style="padding:10px 0; border-bottom:1px solid #F0ECE8;">
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; font-weight:700; color:#241611; margin:0 0 4px; line-height:1.5; word-break:break-all;">${prefix}${escapeHtml(change.sourceUrl)}</p>
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#6F625A; margin:0; line-height:1.6;">${describeChange(change)} <span style="color:#B3A99E;">(${escapeHtml(change.productName)})</span></p>
      </td>
    </tr>`
}

function renderSection(title: string, changes: DigestChange[]): string {
  if (changes.length === 0) return ""
  return `
    <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; font-weight:700; letter-spacing:0.04em; text-transform:uppercase; color:#FF5400; margin:26px 0 8px;">${escapeHtml(title)}</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      ${changes.map(renderChangeRow).join("")}
    </table>`
}

/**
 * One digest email per user, covering every product with changes. Dedupe is
 * structural upstream (tracked_link_events are only written on a state
 * transition), so this always sends exactly one email per unresolved issue —
 * the caller stamps notified_at on the included event ids only after this
 * resolves true, never on a failed send.
 */
export async function sendLinkTrackerDigestEmail({
  to,
  userId,
  userName,
  changes,
  stats,
}: {
  to: string
  userId: string
  userName: string | null
  changes: DigestChange[]
  stats: { tracked: number; live: number; needsAttention: number }
}): Promise<boolean> {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"

  const byType = new Map<TrackedLinkChangeType, DigestChange[]>()
  for (const change of changes) {
    const list = byType.get(change.changeType) ?? []
    list.push(change)
    byType.set(change.changeType, list)
  }

  const sectionsHtml = SEVERITY_ORDER.map((type) => renderSection(SECTION_TITLES[type], byType.get(type) ?? [])).join("")

  const changeCount = changes.length
  const subject = `${pluralize(changeCount, "backlink change", "backlink changes")} detected`

  return sendMentiohuntEmail({
    to,
    subject,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(changeCount, "change", "changes")} across your tracked links.`,
    footerReason: "You received this email because Mentiohunt's Link Tracker found changes to backlinks you're monitoring.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your tracked links, checked</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">Last night's check found ${pluralize(changeCount, "change", "changes")} across the backlinks you're monitoring.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        <tr>
          ${statCard("Tracked", String(stats.tracked), "backlinks being monitored", "33.33%")}
          ${statCard("Live", String(stats.live), "healthy and linking correctly", "33.33%")}
          ${statCard("Needs attention", String(stats.needsAttention), "removed, nofollowed, or changed", "33.33%")}
        </tr>
      </table>
      ${sectionsHtml}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/link-tracker" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Open Link Tracker</a>
          </td>
        </tr>
      </table>
    `,
  })
}
