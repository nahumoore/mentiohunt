import { APP_URL, escapeHtml, sendMentiohuntEmail } from "./base.js"

export async function sendTrialEndingReminder({
  to,
  userName,
  trialEnd,
  userId,
}: {
  to: string
  userName: string | null
  trialEnd: string
  userId: string
}) {
  const firstName = userName?.trim().split(/\s+/)[0]
  return sendMentiohuntEmail({
    to,
    subject: `Your Mentiohunt trial ends ${trialEnd}`,
    previewText: "Review your subscription before the first monthly charge.",
    footerReason:
      "You received this transactional email because your Mentiohunt trial is ending.",
    idempotencyKey: `trial-ending-${userId}-${trialEnd}`,
    body: `
      <p style="font-size:16px;color:#4F423A;margin:0 0 18px;line-height:1.7;">${escapeHtml(firstName ? `Hi ${firstName},` : "Hi,")}</p>
      <h1 style="font-size:28px;color:#241611;margin:0 0 16px;line-height:1.2;">Your free trial is almost over</h1>
      <p style="font-size:16px;color:#4F423A;margin:0 0 18px;line-height:1.7;">Your Mentiohunt trial ends on <strong>${escapeHtml(trialEnd)}</strong>. After that, your Pro subscription renews at $49/month unless you cancel before the trial ends.</p>
      <p style="font-size:15px;color:#6F625A;margin:0 0 24px;line-height:1.7;">You can review or cancel the subscription yourself from Billing. You do not need to contact support.</p>
      <table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="border-radius:10px;background-color:#FF5400;"><a href="${APP_URL}/dashboard/settings?tab=billing" style="display:inline-block;padding:13px 18px;font-size:14px;font-weight:700;color:#FFFFFF;text-decoration:none;">Manage billing</a></td></tr></table>
    `,
  })
}
