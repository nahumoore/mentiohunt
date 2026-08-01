import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { sendOutreachEmail, type OutreachEmailAccount } from "../helpers/emails/send-outreach-email.js"

const log = createLogger("route-prospect-reply")

export const prospectReplyRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function readBodyString(body: unknown, key: string): string {
  if (body === null || typeof body !== "object") return ""
  const value = (body as Record<string, unknown>)[key]
  return typeof value === "string" ? value.trim() : ""
}

prospectReplyRouter.post("/prospects/reply", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const productId = readBodyString(req.body, "productId")
  const prospectId = readBodyString(req.body, "prospectId")
  const messageBody = readBodyString(req.body, "body")
  const emailAccountId = readBodyString(req.body, "emailAccountId")

  if (!userId || !productId || !prospectId || !messageBody) {
    res.status(400).json({ error: "userId, productId, prospectId and body are required" })
    return
  }

  await withRouteLog(`prospect-reply-${prospectId}`, async () => {
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("tier, name")
      .eq("id", userId)
      .maybeSingle()

    const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

    let ownAccountQuery = supabaseAdmin
      .from("email_accounts")
      .select("id, email, name, is_public, smtp_host, smtp_port, smtp_user, smtp_pass")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")

    ownAccountQuery = emailAccountId
      ? ownAccountQuery.eq("id", emailAccountId)
      : ownAccountQuery.order("created_at", { ascending: false })

    const { data: ownAccount } = isPaid ? await ownAccountQuery.limit(1).maybeSingle() : { data: null }

    if (!ownAccount) {
      log.warn("no connected mailbox available for reply", { userId, prospectId, emailAccountId })
      res.status(409).json({ error: "Connect your own mailbox before replying." })
      return
    }

    const { data: prospect, error: prospectError } = await supabaseAdmin
      .from("backlink_prospects")
      .select("id, product_id, contact_email, email_subject")
      .eq("id", prospectId)
      .eq("product_id", productId)
      .maybeSingle()

    if (prospectError || !prospect) {
      log.error("prospect not found", { prospectId, error: prospectError?.message })
      res.status(404).json({ error: "Prospect not found." })
      return
    }

    const { data: priorMessages } = await supabaseAdmin
      .from("prospect_messages")
      .select("message_id, direction, from_email, received_at")
      .eq("prospect_id", prospectId)
      .order("received_at", { ascending: true })

    const priorMessageIds = (priorMessages ?? []).flatMap((m) => (m.message_id ? [m.message_id] : []))
    const inReplyTo = priorMessageIds.length ? priorMessageIds[priorMessageIds.length - 1]! : null

    // Reply to whoever last actually wrote in, not the original outreach address —
    // the contact often answers from a different personal address than the one
    // outreach was sent to, and threading only lands in their inbox if we address
    // the reply back to that same address.
    const lastInbound = [...(priorMessages ?? [])].reverse().find((m) => m.direction === "inbound")
    const recipientEmail = lastInbound?.from_email || prospect.contact_email

    if (!recipientEmail) {
      res.status(400).json({ error: "This prospect has no contact email." })
      return
    }

    const rawSubject = prospect.email_subject?.trim() || recipientEmail
    const subject = /^re:/i.test(rawSubject) ? rawSubject : `Re: ${rawSubject}`

    const account: OutreachEmailAccount = {
      id: ownAccount.id,
      email: ownAccount.email,
      name: ownAccount.name,
      is_public: false,
      smtp_host: ownAccount.smtp_host,
      smtp_port: ownAccount.smtp_port,
      smtp_user: ownAccount.smtp_user,
      smtp_pass: ownAccount.smtp_pass,
    }

    try {
      const result = await sendOutreachEmail({
        account,
        senderName: profile?.name ?? null,
        to: recipientEmail,
        subject,
        body: messageBody,
        inReplyTo,
        references: priorMessageIds.length ? priorMessageIds : undefined,
      })

      const now = new Date().toISOString()
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from("prospect_messages")
        .insert({
          prospect_id: prospectId,
          sequence_id: null,
          email_account_id: account.id,
          direction: "outbound",
          classification: "sent",
          message_id: result.messageId,
          in_reply_to: inReplyTo,
          references: priorMessageIds.length ? priorMessageIds : null,
          from_email: account.email,
          from_name: profile?.name ?? null,
          to_emails: [recipientEmail],
          subject,
          text_body: messageBody,
          received_at: now,
        })
        .select("id, sequence_id, direction, classification, classification_reason, from_email, from_name, subject, text_body, received_at")
        .single()

      if (insertError) {
        log.error("failed to record sent reply", { prospectId, error: insertError.message })
        res.status(500).json({ error: "Reply was sent but failed to save. Refresh to check the thread." })
        return
      }

      log.success("sent prospect reply", { prospectId })
      res.json({ ok: true, message: inserted })
    } catch (error) {
      log.warn("failed to send prospect reply", { prospectId, error: String(error) })
      res.status(502).json({ error: "Failed to send reply. Check your mailbox connection and try again." })
    }
  })
})
