import { decryptSecret } from "@workspace/supabase/crypto"
import nodemailer from "nodemailer"

export type OutreachEmailAccount = {
  id: string
  email: string
  name: string
  is_public: boolean
  smtp_host: string | null
  smtp_port: number | null
  smtp_user: string | null
  smtp_pass: string | null
}

export type OutreachSendResult = {
  messageId: string | null
  response: Record<string, unknown>
}

function htmlFromPlainText(body: string): string {
  const escaped = body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")

  return escaped
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${paragraph.replace(/\n/g, "<br>")}</p>`)
    .join("\n")
}

function senderDisplayName(account: OutreachEmailAccount, senderName: string | null): string {
  const profileName = senderName?.trim()
  if (profileName) return account.is_public ? `${profileName} via Mentiohunt` : profileName
  return account.is_public ? "Mentiohunt" : account.email
}

export async function sendOutreachEmail({
  account,
  senderName,
  sequenceId,
  to,
  subject,
  body,
  inReplyTo,
}: {
  account: OutreachEmailAccount
  senderName: string | null
  sequenceId: string
  to: string
  subject: string
  body: string
  inReplyTo?: string | null
}): Promise<OutreachSendResult> {
  if (!account.smtp_host || !account.smtp_port || !account.smtp_user || !account.smtp_pass) {
    throw new Error("Email account is missing SMTP configuration.")
  }

  const smtpPassword = decryptSecret(account.smtp_pass)
  const transporter = nodemailer.createTransport({
    host: account.smtp_host,
    port: account.smtp_port,
    secure: account.smtp_port === 465,
    auth: { user: account.smtp_user, pass: smtpPassword },
    connectionTimeout: 30_000,
    greetingTimeout: 30_000,
  })

  const info = await transporter.sendMail({
    from: {
      name: senderDisplayName(account, senderName),
      address: account.email,
    },
    to,
    subject,
    text: body,
    html: htmlFromPlainText(body),
    inReplyTo: inReplyTo ?? undefined,
    references: inReplyTo ? [inReplyTo] : undefined,
    headers: {
      "X-Mentiohunt-Sequence-ID": sequenceId,
    },
  })

  return {
    messageId: info.messageId ?? null,
    response: {
      accepted: info.accepted,
      rejected: info.rejected,
      response: info.response,
      envelope: info.envelope,
    },
  }
}
