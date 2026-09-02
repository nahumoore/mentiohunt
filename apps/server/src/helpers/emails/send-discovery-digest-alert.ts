import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard } from "./base.js"

export type DiscoveryDigestLine = {
  /** Human-readable strategy name, e.g. "Competitor backlinks". */
  label: string
  /** Opportunities that strategy produced in this run (always > 0). */
  count: number
}

/**
 * A single daily email covering every discovery strategy that produced
 * opportunities for one product, replacing the previous one-email-per-strategy
 * behaviour that spammed users on multi-strategy adaptive runs.
 */
export async function sendDiscoveryDigestAlertEmail({
  to,
  userId,
  userName,
  productName,
  breakdown,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  breakdown: DiscoveryDigestLine[]
}) {
  const total = breakdown.reduce((sum, line) => sum + line.count, 0)
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)

  const rows = breakdown
    .map(
      (line) => `
      <tr>
        <td style="padding:12px 16px; border:1px solid #F0ECE8; border-radius:12px; background-color:#FFFFFF;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; font-weight:600; color:#241611; line-height:1.5;">${escapeHtml(line.label)}</td>
              <td align="right" style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; font-weight:700; color:#FF5400; line-height:1.5; white-space:nowrap;">${line.count}</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td style="height:8px; line-height:8px; font-size:8px;">&nbsp;</td></tr>`
    )
    .join("")

  await sendMentiohuntEmail({
    to,
    subject: `${pluralize(total, "new backlink opportunity", "new backlink opportunities")} for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `Today's discovery run found ${pluralize(total, "new opportunity", "new opportunities")} for ${productName} across ${pluralize(breakdown.length, "strategy", "strategies")}.`,
    footerReason:
      "You received this email because Mentiohunt found new backlink opportunities for your product.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">New backlink opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">Today's discovery run for <strong style="color:#241611;">${escapedProductName}</strong> turned up sites where your pages fit and aren't linked yet.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        <tr>${statCard("New opportunities", String(total), `across ${pluralize(breakdown.length, "discovery strategy", "discovery strategies")}`, "100%")}</tr>
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#6F625A; margin:22px 0 10px; line-height:1.4;">By strategy</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        ${rows}
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:14px 0 24px; line-height:1.7;">Review the fit rationale and outreach draft for each one, then approve the ones worth sending.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Review your opportunities</a>
          </td>
        </tr>
      </table>
    `,
  })
}
