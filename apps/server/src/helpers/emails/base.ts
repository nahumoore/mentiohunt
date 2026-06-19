import { ALERTS_FROM } from "@workspace/supabase/email-settings"
import { Resend } from "resend"
import { createLogger } from "../logger.js"
import { escapeHtml, mentiohuntTemplate } from "./email-template.js"

const log = createLogger("email")
export const APP_URL = "https://mentiohunt.com"

export { escapeHtml }

export function getResend() {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) throw new Error("Missing RESEND_API_KEY")
  return new Resend(apiKey)
}

export function pluralize(count: number, singular: string, plural = `${singular}s`) {
  return `${count} ${count === 1 ? singular : plural}`
}

export function statCard(label: string, value: string, detail: string, width = "50%") {
  return `
    <td class="mobile-stack" width="${width}" style="padding:0 6px 12px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #F0ECE8; border-radius:12px; background-color:#FFFFFF;">
        <tr>
          <td style="padding:18px;">
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:12px; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; color:#FF5400; margin:0 0 8px; line-height:1.4;">${escapeHtml(label)}</p>
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:28px; font-weight:700; color:#241611; margin:0; line-height:1.1;">${escapeHtml(value)}</p>
            <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:13px; color:#6F625A; margin:8px 0 0; line-height:1.5;">${escapeHtml(detail)}</p>
          </td>
        </tr>
      </table>
    </td>`
}

export function statusNote(title: string, message: string) {
  return `
    <tr>
      <td colspan="2" style="padding:14px 16px; border:1px solid #F0ECE8; border-radius:12px; background-color:#FFF8F2;">
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; font-weight:700; color:#241611; margin:0 0 4px; line-height:1.5;">${escapeHtml(title)}</p>
        <p style="font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; font-size:14px; color:#6F625A; margin:0; line-height:1.6;">${escapeHtml(message)}</p>
      </td>
    </tr>`
}

export async function sendMentiohuntEmail({
  to,
  subject,
  body,
  previewText,
  footerReason,
  unsubscribeUrl,
}: {
  to: string
  subject: string
  body: string
  previewText?: string
  footerReason?: string
  unsubscribeUrl?: string
}) {
  try {
    const resend = getResend()
    const email = mentiohuntTemplate({
      subject,
      body,
      previewText,
      footerReason,
      unsubscribeUrl,
    })

    await resend.emails.send({
      from: ALERTS_FROM,
      to,
      subject: email.subject,
      html: email.html,
      headers: unsubscribeUrl
        ? {
            "List-Unsubscribe": `<${unsubscribeUrl}>`,
            "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
          }
        : undefined,
    })
  } catch (err) {
    log.warn("failed to send email", { error: String(err), to, subject })
  }
}
