import { Resend } from "resend"

import { PRIMARY_EMAIL } from "@workspace/email-settings"
import { supabaseAdmin } from "@workspace/supabase/admin"

import type { SupportConversationRow, SupportMessageRow } from "./types"

const NOTIFY_DEBOUNCE_MS = 15 * 60 * 1000

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
}

function describeSender(conversation: SupportConversationRow): string {
  if (conversation.name && conversation.email) {
    return `${conversation.name} <${conversation.email}>`
  }
  if (conversation.email) return conversation.email
  if (conversation.user_id) return "Logged-in user (no email captured yet)"
  return "Anonymous visitor"
}

/**
 * Emails the founder about a new visitor message. Debounced per conversation
 * so a burst of messages produces one email, not one per message — skipped
 * if a notification already went out for this conversation in the last 15m.
 */
export async function notifyNewVisitorMessage(
  conversation: SupportConversationRow,
  message: SupportMessageRow
): Promise<void> {
  if (conversation.last_notified_at) {
    const elapsedMs =
      Date.now() - new Date(conversation.last_notified_at).getTime()
    if (elapsedMs < NOTIFY_DEBOUNCE_MS) return
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[support-chat] Missing RESEND_API_KEY, skipping notification email")
    return
  }

  const identity = describeSender(conversation)
  const resend = new Resend(apiKey)

  const { error } = await resend.emails.send({
    from: "Mentiohunt <contact@mentiohunt.com>",
    to: PRIMARY_EMAIL,
    replyTo: conversation.email ?? undefined,
    subject: `New support chat message — ${identity}`,
    html: `
      <h2>New support chat message</h2>
      <table cellpadding="6" style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
        <tr><td><strong>From</strong></td><td>${escapeHtml(identity)}</td></tr>
        <tr><td><strong>Page</strong></td><td>${escapeHtml(conversation.current_path ?? "—")}</td></tr>
        <tr><td><strong>Message</strong></td><td>${escapeHtml(message.body)}</td></tr>
      </table>
      <p style="margin-top:16px;font-size:13px;color:#6F625A">
        Reply from your local console: run <code>pnpm dev</code> and open
        <a href="http://localhost:3000/support">localhost:3000/support</a>.
      </p>
    `,
  })

  if (error) {
    console.error("[support-chat] Failed to send notification email:", error)
    return
  }

  await supabaseAdmin
    .from("support_conversations")
    .update({ last_notified_at: new Date().toISOString() })
    .eq("id", conversation.id)
}
