import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard } from "./base.js"

export async function sendMediaMentionsDigestEmail({
  to,
  userId,
  inserted,
  bySource,
}: {
  to: string
  userId: string
  inserted: number
  bySource: Record<string, number>
}) {
  const label = inserted === 1 ? "opportunity" : "opportunities"
  const sourceLines = Object.entries(bySource)
    .map(([source, count]) => `${count} from ${source}`)
    .join(", ")
  const sourceSummary = sourceLines || `${inserted} total`

  await sendMentiohuntEmail({
    to,
    subject: `${inserted} new media ${label} found`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "digest"),
    previewText: `${sourceSummary} — journalists and media professionals looking for sources.`,
    footerReason: "You received this email because you have an active Mentiohunt account.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">Hi,</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">New media opportunities</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">We found <strong style="color:#241611;">${escapeHtml(pluralize(inserted, "new media opportunity", "new media opportunities"))}</strong> — journalists and PR professionals looking for sources, quotes, or products for upcoming stories.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 24px;">
        <tr>
          ${statCard("New opportunities", String(inserted), escapeHtml(sourceSummary))}
        </tr>
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:0 0 24px; line-height:1.7;">Review each request and reach out while the thread is still active.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/backlinks/media-mentions" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Browse media opportunities</a>
          </td>
        </tr>
      </table>
    `,
  })
}
