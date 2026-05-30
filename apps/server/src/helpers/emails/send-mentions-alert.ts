import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail } from "./base.js"

export async function sendMentionsAlert({
  to,
  userId,
  productName,
  mentionsCount,
}: {
  to: string
  userId: string
  productName: string
  mentionsCount: number
}) {
  const mentionLabel = mentionsCount === 1 ? "mention" : "mentions"
  const subject = `${mentionsCount} new ${mentionLabel} found for ${productName}`

  await sendMentiohuntEmail({
    to,
    subject,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `We found ${pluralize(mentionsCount, "mention")} that could be worth replying to.`,
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">Hi,</p>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 24px; line-height:1.7;">We found <strong style="color:#241611;">${escapeHtml(pluralize(mentionsCount, "mention"))}</strong> for <strong style="color:#241611;">${escapeHtml(productName)}</strong> that could be worth replying to.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/community-mentions/reply-queue" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">View your reply queue</a>
          </td>
        </tr>
      </table>
    `,
  })
}
