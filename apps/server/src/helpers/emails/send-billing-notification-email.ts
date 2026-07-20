import { APP_URL, escapeHtml, sendMentiohuntEmail } from "./base.js"

export type BillingNotificationType =
  | "subscription_created"
  | "subscription_updated"
  | "subscription_deleted"
  | "payment_failed"

export type BillingTier = "free" | "pro" | "agency"

const PLAN_NAMES: Record<Exclude<BillingTier, "free">, string> = {
  pro: "Pro",
  agency: "Growth",
}

function planName(tier: BillingTier | null): string {
  if (!tier || tier === "free") return "Free"
  return PLAN_NAMES[tier]
}

function ctaButton(label: string, href: string): string {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="border-radius:10px; background-color:#FF5400;">
          <a href="${href}" style="display:inline-block; padding:13px 18px; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#FFFFFF; text-decoration:none; border-radius:10px;">${escapeHtml(label)}</a>
        </td>
      </tr>
    </table>`
}

function heading(text: string): string {
  return `<h1 style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; color:#241611; margin:0 0 16px; line-height:1.2; letter-spacing:-0.5px;">${escapeHtml(text)}</h1>`
}

function paragraph(html: string): string {
  return `<p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 26px; line-height:1.7;">${html}</p>`
}

function buildContent({
  type,
  greeting,
  tier,
}: {
  type: BillingNotificationType
  greeting: string
  tier: BillingTier | null
}): { subject: string; previewText: string; body: string } {
  const plan = escapeHtml(planName(tier))
  const greetingHtml = `<p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:16px; color:#4F423A; margin:0 0 18px; line-height:1.7;">${escapeHtml(greeting)}</p>`

  switch (type) {
    case "subscription_created":
      return {
        subject: `You're on Mentiohunt ${plan}`,
        previewText: `Thanks for subscribing to Mentiohunt ${plan}.`,
        body: `
          ${greetingHtml}
          ${heading(`Thanks for subscribing to ${plan}`)}
          ${paragraph(`Thank you for subscribing to Mentiohunt <strong style="color:#241611;">${plan}</strong>. Discovery runs are already scheduled — new opportunities will start landing in your queue.`)}
          ${ctaButton("Go to your queue", `${APP_URL}/dashboard`)}
        `,
      }
    case "subscription_updated":
      return {
        subject: `Your Mentiohunt plan changed to ${plan}`,
        previewText: `Your Mentiohunt plan is now ${plan}.`,
        body: `
          ${greetingHtml}
          ${heading("Your plan was updated")}
          ${paragraph(`Your Mentiohunt subscription is now on the <strong style="color:#241611;">${plan}</strong> plan. Billing and discovery limits reflect the new plan starting this cycle.`)}
          ${ctaButton("Review billing", `${APP_URL}/dashboard/billing`)}
        `,
      }
    case "subscription_deleted":
      return {
        subject: "Your Mentiohunt subscription has been canceled",
        previewText: "Your Mentiohunt subscription was canceled.",
        body: `
          ${greetingHtml}
          ${heading("Subscription canceled")}
          ${paragraph("Your Mentiohunt subscription has been canceled and your account is now on the Free plan. Discovery runs and new opportunities are paused — anything already in your queue stays there.")}
          ${ctaButton("Resubscribe", `${APP_URL}/dashboard/billing`)}
        `,
      }
    case "payment_failed":
      return {
        subject: "We couldn't process your Mentiohunt payment",
        previewText: "Your last Mentiohunt payment failed.",
        body: `
          ${greetingHtml}
          ${heading("Payment failed")}
          ${paragraph("We weren't able to charge your card for your Mentiohunt subscription. Your account has been moved to the Free plan until payment succeeds — update your payment method to pick back up where you left off.")}
          ${ctaButton("Update payment method", `${APP_URL}/dashboard/billing`)}
        `,
      }
  }
}

export async function sendBillingNotificationEmail({
  to,
  name,
  type,
  tier,
}: {
  to: string
  name: string | null
  type: BillingNotificationType
  tier: BillingTier | null
}) {
  const firstName = name?.trim().split(/\s+/)[0]
  const greeting = firstName ? `Hi ${firstName},` : "Hi,"

  const { subject, previewText, body } = buildContent({ type, greeting, tier })

  await sendMentiohuntEmail({
    to,
    subject,
    previewText,
    footerReason: "You received this email because of a billing change on your Mentiohunt account.",
    body,
  })
}
