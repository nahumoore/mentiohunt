import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail, statCard } from "./base.js"

export async function sendListicleAlertEmail({
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
    subject: `New listicle opportunities for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(prospectsCreated, "new listicle opportunity", "new listicle opportunities")} for ${productName}.`,
    footerReason:
      "You received this email because Mentiohunt found new listicle & roundup opportunities for your product.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">New roundup opportunities are ready</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">Today's listicle & roundup scan for <strong style="color:#241611;">${escapedProductName}</strong> turned up pages where your product isn't listed yet, but fits.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 -6px 10px;">
        <tr>${statCard("Listicle opportunities", String(prospectsCreated), `roundup posts where ${productName} could be added`, "100%")}</tr>
      </table>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:15px; color:#6F625A; margin:18px 0 24px; line-height:1.7;">Review the fit rationale and outreach draft for each one, then approve the ones worth sending.</p>
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
