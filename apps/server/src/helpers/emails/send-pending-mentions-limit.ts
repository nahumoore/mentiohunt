import { generateUnsubscribeUrl } from "./unsubscribe.js"
import { APP_URL, escapeHtml, pluralize, sendMentiohuntEmail } from "./base.js"

export async function sendPendingMentionsLimitEmail({
  to,
  userId,
  productName,
  pendingCount,
}: {
  to: string
  userId: string
  productName: string
  pendingCount: number
}) {
  await sendMentiohuntEmail({
    to,
    subject: `You have ${pendingCount} pending mentions to review for ${productName}`,
    unsubscribeUrl: generateUnsubscribeUrl(userId, "alerts"),
    previewText: `Review your ${pendingCount} pending mentions before we can find more for ${productName}.`,
    footerReason: "You received this email because you have an active Mentiohunt account.",
    body: `
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">Hi,</p>
      <h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">Your reply queue is full</h1>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 24px; line-height:1.7;">You have <strong style="color:#241611;">${escapeHtml(pluralize(pendingCount, "mention"))}</strong> waiting in your queue for <strong style="color:#241611;">${escapeHtml(productName)}</strong>. We paused discovery while they pile up — review and action them so we can find more opportunities.</p>
      <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#6F625A; margin:0 0 24px; line-height:1.7;">On a paid plan, there is no limit — we keep finding mentions regardless of how many are pending.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td style="border-radius:10px; background-color:#FF5400;">
            <a href="${APP_URL}/dashboard/community-mentions/reply-queue" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">Review your reply queue</a>
          </td>
        </tr>
      </table>
    `,
  })
}
