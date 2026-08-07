import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard } from "./base.js"

export async function sendBrokenLinkAlertEmail({
  to,
  userId,
  userName,
  productName,
  prospectsCreated,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  prospectsCreated: number
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const escapedProductName = escapeHtml(productName)

  await sendMentiohuntEmail({
    to,
    subject: `New broken link opportunities for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(prospectsCreated, "dead link", "dead links")} pointing at competitor content for ${productName}.`,
    footerReason: "You received this email because Mentiohunt found new broken link opportunities for your product.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">New broken link opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">Today's scan for <strong style="color:#241611;">${escapedProductName}</strong> found pages linking to dead URLs in your competitors' backlink profiles, with one of your own pages as a credible replacement.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        <tr>${statCard("Broken link opportunities", String(prospectsCreated), `sites with a dead link ${productName} could replace`, "100%")}</tr>
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:18px 0 24px; line-height:1.7;">Each one comes with the exact dead URL and its status, so you can verify it yourself before sending.</p>
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
