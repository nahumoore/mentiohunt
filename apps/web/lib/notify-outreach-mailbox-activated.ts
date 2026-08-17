import { PRIMARY_EMAIL } from "@workspace/email-settings"
import { Resend } from "resend"

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

// TrulyInbox (our warmup vendor) has no onboarding API yet, so pool inboxes
// get added to its dashboard by hand — this just pages us to do that for a
// newly activated customer-owned mailbox. Keep the vendor name out of any
// user-facing copy.
export async function notifyOwnMailboxActivated(email: string, userId: string) {
  const resend = new Resend(process.env.RESEND_API_KEY)
  const { error } = await resend.emails.send({
    from: "Mentiohunt <contact@mentiohunt.com>",
    to: PRIMARY_EMAIL,
    subject: `Add to TrulyInbox: ${email}`,
    html: `
      <p>A customer just enabled automated outreach from their own mailbox. Add it to the TrulyInbox warmup dashboard.</p>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td><strong>Email</strong></td><td>${escapeHtml(email)}</td></tr>
        <tr><td><strong>User ID</strong></td><td>${userId}</td></tr>
      </table>
    `,
  })

  if (error) {
    console.error("Failed to send TrulyInbox activation notice:", error)
  }
}
