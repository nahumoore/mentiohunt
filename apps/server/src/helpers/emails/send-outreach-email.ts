import { decryptSecret } from "@workspace/supabase/crypto"
import nodemailer from "nodemailer"
import { buildSignatureHtml, buildSignatureText } from "./signature.js"

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
  signature,
  inReplyTo,
  references,
}: {
  account: OutreachEmailAccount
  senderName: string | null
  sequenceId?: string
  to: string
  subject: string
  body: string
  signature?: string | null
  inReplyTo?: string | null
  references?: string[]
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

  const signatureText = buildSignatureText(signature)
  const text = signatureText ? `${body}\n\n${signatureText}` : body
  const html = htmlFromPlainText(body) + buildSignatureHtml(signature)

  const info = await transporter.sendMail({
    from: {
      name: senderDisplayName(account, senderName),
      address: account.email,
    },
    to,
    subject,
    text,
    html,
    inReplyTo: inReplyTo ?? undefined,
    references: references ?? (inReplyTo ? [inReplyTo] : undefined),
    headers: sequenceId
      ? {
          "X-Mentiohunt-Sequence-ID": sequenceId,
        }
      : undefined,
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
