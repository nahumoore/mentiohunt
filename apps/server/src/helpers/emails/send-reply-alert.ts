import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, sendMentiohuntEmail } from "./base.js"

export async function sendReplyAlertEmail({
  to,
  userId,
  userName,
  productName,
  domain,
  contactName,
}: {
  to: string
  userId: string
  userName: string | null
  productName: string
  domain: string | null
  contactName: string | null
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"
  const site = domain ? escapeHtml(domain) : "a prospect"
  const from = contactName ? escapeHtml(contactName) : site

  await sendMentiohuntEmail({
    to,
    subject: `New reply from ${site}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `${from} replied to your outreach for ${productName}.`,
    footerReason: "You received this email because a prospect replied to outreach sent on your behalf.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">You got a reply</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;"><strong style="color:#241611;">${from}</strong> replied to outreach sent for <strong style="color:#241611;">${escapeHtml(productName)}</strong>. Outreach for this prospect has been paused — reply directly from your own inbox to keep it there. Our sending mailbox isn't monitored for conversations.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">View reply details</a>
          </td>
        </tr>
      </table>
    `,
  })
}
