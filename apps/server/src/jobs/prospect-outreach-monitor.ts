import { supabaseAdmin } from "@workspace/supabase/admin"
import { decryptSecret } from "@workspace/supabase/crypto"
import type { Json, Tables } from "@workspace/supabase/database-types"
import { ImapFlow } from "imapflow"
import { simpleParser, type AddressObject, type ParsedMail } from "mailparser"
import { classifyInboundEmail, extractMessageIds, normalizeEmail, normalizeMessageId, normalizeSubject, type HeaderMap, type InboundClassification } from "../helpers/outreach/inbound-email.js"
import { stopProspectSequence } from "../helpers/outreach/stop-prospect-sequence.js"
import { sendReplyAlertEmail } from "../helpers/emails/send-reply-alert.js"
import { createLogger } from "../helpers/logger.js"
import { loadProspectIdsForUser } from "./prospect-outreach-sender.js"

const log = createLogger("prospect-outreach-monitor")

const MAILBOX = "INBOX"
const MAX_ACCOUNTS_PER_TICK = 10
const MAX_MESSAGES_PER_ACCOUNT = 100
const STALE_LOCK_MINUTES = 10
const RECENT_SEQUENCE_LIMIT = 500
const RECENT_SEQUENCE_DAYS = 120

type EmailAccount = Pick<
  Tables<"email_accounts">,
  | "id"
  | "email"
  | "imap_host"
  | "imap_port"
  | "imap_user"
  | "imap_pass"
  | "smtp_user"
  | "smtp_pass"
  | "status"
>

type MailboxSync = Pick<
  Tables<"email_account_mailbox_syncs">,
  "id" | "email_account_id" | "mailbox" | "uid_validity" | "last_uid" | "locked_at"
>

type SequenceRow = Pick<
  Tables<"prospect_sequences">,
  "id" | "prospect_id" | "email_account_id" | "status" | "sent_at" | "subject" | "message_id" | "step"
>

type ProspectRow = Pick<Tables<"backlink_prospects">, "id" | "contact_email" | "contact_name" | "domain" | "product_id" | "status">

type MatchedSequence = SequenceRow & { prospect: ProspectRow }

type ParsedInbound = {
  parsed: ParsedMail
  headers: HeaderMap
  rawText: string
  uid: number
  uidValidity: number | null
  fromEmail: string | null
  fromName: string | null
  toEmails: string[]
  subject: string
  textBody: string
  htmlBody: string | null
  receivedAt: string
  messageId: string | null
  inReplyTo: string | null
  references: string[]
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json
}

function daysAgo(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

function headerToString(value: unknown): string {
  if (value == null) return ""
  if (typeof value === "string") return value
  if (Array.isArray(value)) return value.map(headerToString).filter(Boolean).join(", ")
  if (value instanceof Date) return value.toISOString()
  if (typeof value === "object" && "text" in value && typeof value.text === "string") return value.text
  return String(value)
}

function headersFromParsed(parsed: ParsedMail): HeaderMap {
  const headers: HeaderMap = {}
  for (const [key, value] of parsed.headers.entries()) {
    headers[key.toLowerCase()] = headerToString(value)
  }
  return headers
}

function addressList(input: AddressObject | AddressObject[] | undefined): string[] {
  const objects = Array.isArray(input) ? input : input ? [input] : []
  return objects.flatMap((object) => object.value.flatMap((item) => normalizeEmail(item.address) ?? []))
}

function firstAddress(input: AddressObject | undefined): { email: string | null; name: string | null } {
  const first = input?.value.at(0)
  return {
    email: normalizeEmail(first?.address),
    name: first?.name?.trim() || null,
  }
}

function referencesFromParsed(parsed: ParsedMail, headers: HeaderMap): string[] {
  const rawReferences = Array.isArray(parsed.references)
    ? parsed.references.join(" ")
    : typeof parsed.references === "string"
      ? parsed.references
      : headers.references
  return extractMessageIds(rawReferences)
}

function extractSequenceId(headers: HeaderMap, rawText: string): string | null {
  const headerValue = headers["x-mentiohunt-sequence-id"]
  const value = headerValue || rawText.match(/x-mentiohunt-sequence-id:\s*([0-9a-f-]{36})/i)?.[1]
  return value?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0] ?? null
}

async function recordEvent({
  prospectId,
  sequenceId,
  emailAccountId,
  eventType,
  recipientEmail,
  metadata,
}: {
  prospectId: string
  sequenceId: string | null
  emailAccountId: string | null
  eventType: string
  recipientEmail?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin.from("outreach_events").insert({
    prospect_id: prospectId,
    sequence_id: sequenceId,
    email_account_id: emailAccountId,
    event_type: eventType,
    recipient_email: recipientEmail ?? null,
    metadata: metadata ? toJson(metadata) : null,
  })

  if (error) {
    log.warn("failed to record inbound outreach event", { prospectId, sequenceId, eventType, error: error.message })
  }
}

async function ensureSyncRow(accountId: string): Promise<MailboxSync | null> {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("email_account_mailbox_syncs")
    .select("id, email_account_id, mailbox, uid_validity, last_uid, locked_at")
    .eq("email_account_id", accountId)
    .eq("mailbox", MAILBOX)
    .maybeSingle()

  if (existingError) {
    log.warn("failed to load mailbox sync", { accountId, error: existingError.message })
    return null
  }

  if (existing) return existing

  const { data: inserted, error: insertError } = await supabaseAdmin
    .from("email_account_mailbox_syncs")
    .insert({ email_account_id: accountId, mailbox: MAILBOX })
    .select("id, email_account_id, mailbox, uid_validity, last_uid, locked_at")
    .maybeSingle()

  if (insertError || !inserted) {
    log.warn("failed to create mailbox sync", { accountId, error: insertError?.message })
    return null
  }

  return inserted
}

async function claimSync(sync: MailboxSync): Promise<MailboxSync | null> {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from("email_account_mailbox_syncs")
    .update({ locked_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() })
    .eq("id", sync.id)
    .or(`locked_at.is.null,locked_at.lt.${staleBefore}`)
    .select("id, email_account_id, mailbox, uid_validity, last_uid, locked_at")
    .maybeSingle()

  if (error) {
    log.warn("failed to claim mailbox sync", { syncId: sync.id, error: error.message })
    return null
  }

  return data
}

async function releaseSync(syncId: string, patch: Partial<Tables<"email_account_mailbox_syncs">>): Promise<void> {
  const { error } = await supabaseAdmin
    .from("email_account_mailbox_syncs")
    .update({ ...patch, locked_at: null, updated_at: new Date().toISOString() })
    .eq("id", syncId)

  if (error) {
    log.warn("failed to release mailbox sync", { syncId, error: error.message })
  }
}

async function loadSequenceWithProspect(sequence: SequenceRow): Promise<MatchedSequence | null> {
  const { data: prospect, error } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, contact_email, contact_name, domain, product_id, status")
    .eq("id", sequence.prospect_id)
    .maybeSingle()

  if (error || !prospect) {
    log.warn("failed to load prospect for inbound match", { sequenceId: sequence.id, prospectId: sequence.prospect_id, error: error?.message })
    return null
  }

  return { ...sequence, prospect }
}

async function loadSequenceById(sequenceId: string, accountId: string): Promise<MatchedSequence | null> {
  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .select("id, prospect_id, email_account_id, status, sent_at, subject, message_id, step")
    .eq("id", sequenceId)
    .eq("email_account_id", accountId)
    .maybeSingle()

  if (error || !data || data.status !== "sent") return null
  return loadSequenceWithProspect(data)
}

async function loadRecentSentSequences(accountId: string): Promise<MatchedSequence[]> {
  const { data: sequences, error } = await supabaseAdmin
    .from("prospect_sequences")
    .select("id, prospect_id, email_account_id, status, sent_at, subject, message_id, step")
    .eq("email_account_id", accountId)
    .eq("status", "sent")
    .gte("sent_at", daysAgo(RECENT_SEQUENCE_DAYS))
    .order("sent_at", { ascending: false })
    .limit(RECENT_SEQUENCE_LIMIT)

  if (error || !sequences?.length) {
    if (error) log.warn("failed to load recent sent sequences", { accountId, error: error.message })
    return []
  }

  const prospectIds = [...new Set(sequences.map((sequence) => sequence.prospect_id))]
  const { data: prospects, error: prospectError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, contact_email, contact_name, domain, product_id, status")
    .in("id", prospectIds)

  if (prospectError) {
    log.warn("failed to load prospects for inbound matching", { accountId, error: prospectError.message })
    return []
  }

  const prospectsById = new Map((prospects ?? []).map((prospect) => [prospect.id, prospect]))
  return sequences.flatMap((sequence) => {
    const prospect = prospectsById.get(sequence.prospect_id)
    return prospect ? [{ ...sequence, prospect }] : []
  })
}

async function matchInbound(accountId: string, inbound: ParsedInbound): Promise<MatchedSequence | null> {
  const sequenceId = extractSequenceId(inbound.headers, inbound.rawText)
  if (sequenceId) {
    const match = await loadSequenceById(sequenceId, accountId)
    if (match) return match
  }

  const messageIds = new Set([
    ...extractMessageIds(inbound.inReplyTo),
    ...inbound.references,
    ...extractMessageIds(inbound.rawText.match(/message-id:\s*(<[^>]+>)/i)?.[1]),
  ])

  const recentSequences = await loadRecentSentSequences(accountId)

  if (messageIds.size > 0) {
    const headerMatch = recentSequences.find((sequence) => {
      const sentMessageId = normalizeMessageId(sequence.message_id)
      return sentMessageId ? messageIds.has(sentMessageId) : false
    })
    if (headerMatch) return headerMatch
  }

  const fromEmail = normalizeEmail(inbound.fromEmail)
  const normalizedInboundSubject = normalizeSubject(inbound.subject)
  const receivedAt = new Date(inbound.receivedAt).getTime()

  const fallbackMatches = recentSequences.filter((sequence) => {
    const contactEmail = normalizeEmail(sequence.prospect.contact_email)
    const sentAt = sequence.sent_at ? new Date(sequence.sent_at).getTime() : 0
    return (
      !!fromEmail &&
      !!contactEmail &&
      fromEmail === contactEmail &&
      normalizeSubject(sequence.subject) === normalizedInboundSubject &&
      receivedAt >= sentAt
    )
  })

  return fallbackMatches.length === 1 ? fallbackMatches[0]! : null
}

async function parseInbound(source: Buffer, uid: number, uidValidity: number | null): Promise<ParsedInbound> {
  const parsed = await simpleParser(source)
  const headers = headersFromParsed(parsed)
  const from = firstAddress(parsed.from)
  const htmlBody = typeof parsed.html === "string" ? parsed.html : null
  const references = referencesFromParsed(parsed, headers)

  return {
    parsed,
    headers,
    rawText: source.toString("utf8").slice(0, 200_000),
    uid,
    uidValidity,
    fromEmail: from.email,
    fromName: from.name,
    toEmails: addressList(parsed.to),
    subject: parsed.subject ?? "",
    textBody: parsed.text ?? "",
    htmlBody,
    receivedAt: (parsed.date ?? new Date()).toISOString(),
    messageId: normalizeMessageId(parsed.messageId ?? headers["message-id"]),
    inReplyTo: normalizeMessageId(parsed.inReplyTo ?? headers["in-reply-to"]),
    references,
  }
}

async function storeMessage({
  inbound,
  match,
  classification,
  confidence,
  reason,
}: {
  inbound: ParsedInbound
  match: MatchedSequence
  classification: InboundClassification
  confidence: number
  reason: string
}): Promise<boolean> {
  const { error } = await supabaseAdmin.from("prospect_messages").insert({
    prospect_id: match.prospect_id,
    sequence_id: match.id,
    email_account_id: match.email_account_id,
    direction: "inbound",
    classification,
    classification_confidence: confidence,
    classification_reason: reason,
    message_id: inbound.messageId,
    in_reply_to: inbound.inReplyTo,
    references: inbound.references,
    imap_uid: inbound.uid,
    imap_uid_validity: inbound.uidValidity,
    from_email: inbound.fromEmail,
    from_name: inbound.fromName,
    to_emails: inbound.toEmails,
    subject: inbound.subject,
    text_body: inbound.textBody,
    html_body: inbound.htmlBody,
    received_at: inbound.receivedAt,
    headers: toJson(inbound.headers),
    metadata: toJson({ step: match.step }),
  })

  if (!error) return true
  if (error.code === "23505") return false

  log.warn("failed to store prospect message", { sequenceId: match.id, prospectId: match.prospect_id, error: error.message })
  return false
}

async function notifyUserOfReply(match: MatchedSequence): Promise<void> {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("user_id, product_name")
    .eq("id", match.prospect.product_id)
    .maybeSingle()

  if (productError || !product) {
    log.warn("failed to load product for reply alert", { sequenceId: match.id, error: productError?.message })
    return
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("email, name")
    .eq("id", product.user_id)
    .maybeSingle()

  if (profileError || !profile?.email) {
    log.warn("no profile email, skipping reply alert", { sequenceId: match.id, userId: product.user_id, error: profileError?.message })
    return
  }

  await sendReplyAlertEmail({
    to: profile.email,
    userId: product.user_id,
    userName: profile.name,
    productName: product.product_name,
    domain: match.prospect.domain,
    contactName: match.prospect.contact_name,
  })
}

async function applyClassification(match: MatchedSequence, inbound: ParsedInbound, classification: InboundClassification, reason: string): Promise<void> {
  const metadata = { classificationReason: reason, inboundMessageId: inbound.messageId, imapUid: inbound.uid }

  if (classification === "bounce") {
    await supabaseAdmin
      .from("prospect_sequences")
      .update({ status: "bounced", bounced_at: new Date().toISOString(), bounce_reason: reason })
      .eq("id", match.id)

    await stopProspectSequence({
      prospectId: match.prospect_id,
      sequenceId: match.id,
      emailAccountId: match.email_account_id,
      recipientEmail: match.prospect.contact_email,
      reason: "bounce",
      eventType: "bounce_detected",
      prospectStatus: "bounced",
      suppress: true,
      metadata,
    })
    return
  }

  if (classification === "human_reply") {
    await stopProspectSequence({
      prospectId: match.prospect_id,
      sequenceId: match.id,
      emailAccountId: match.email_account_id,
      recipientEmail: match.prospect.contact_email,
      reason: "reply",
      eventType: "reply_detected",
      prospectStatus: "negotiating",
      metadata,
    })
    await notifyUserOfReply(match)
    return
  }

  if (classification === "unsubscribe") {
    await stopProspectSequence({
      prospectId: match.prospect_id,
      sequenceId: match.id,
      emailAccountId: match.email_account_id,
      recipientEmail: match.prospect.contact_email,
      reason: "unsubscribe",
      eventType: "unsubscribe_detected",
      suppress: true,
      metadata,
    })
    return
  }

  if (classification === "negative_reply") {
    await stopProspectSequence({
      prospectId: match.prospect_id,
      sequenceId: match.id,
      emailAccountId: match.email_account_id,
      recipientEmail: match.prospect.contact_email,
      reason: "stop_request",
      eventType: "negative_reply_detected",
      metadata,
    })
    return
  }

  if (classification === "wrong_person") {
    await stopProspectSequence({
      prospectId: match.prospect_id,
      sequenceId: match.id,
      emailAccountId: match.email_account_id,
      recipientEmail: match.prospect.contact_email,
      reason: "wrong_person",
      eventType: "wrong_person_detected",
      metadata,
    })
    return
  }

  await recordEvent({
    prospectId: match.prospect_id,
    sequenceId: match.id,
    emailAccountId: match.email_account_id,
    eventType:
      classification === "auto_reply"
        ? "auto_reply_detected"
        : classification === "challenge"
          ? "challenge_detected"
          : "inbound_needs_review",
    recipientEmail: match.prospect.contact_email,
    metadata,
  })
}

async function processMessage(accountId: string, source: Buffer, uid: number, uidValidity: number | null): Promise<boolean> {
  const inbound = await parseInbound(source, uid, uidValidity)
  const match = await matchInbound(accountId, inbound)
  if (!match) return false

  const result = await classifyInboundEmail({
    headers: inbound.headers,
    fromEmail: inbound.fromEmail,
    subject: inbound.subject,
    textBody: inbound.textBody,
  })

  const inserted = await storeMessage({
    inbound,
    match,
    classification: result.classification,
    confidence: result.confidence,
    reason: result.reason,
  })

  if (!inserted) return true

  await applyClassification(match, inbound, result.classification, result.reason)
  log.info("processed matched inbound outreach email", {
    accountId,
    sequenceId: match.id,
    prospectId: match.prospect_id,
    classification: result.classification,
  })
  return true
}

function resolveImapCredentials(account: EmailAccount): { user: string; pass: string } {
  const user = account.imap_user ?? account.smtp_user
  const encryptedPass = account.imap_pass ?? account.smtp_pass
  if (!user || !encryptedPass) throw new Error("Email account is missing IMAP configuration.")
  return { user, pass: decryptSecret(encryptedPass) }
}

async function processAccount(account: EmailAccount): Promise<void> {
  if (!account.imap_host || !account.imap_port) return

  const sync = await ensureSyncRow(account.id)
  if (!sync) return

  const claimed = await claimSync(sync)
  if (!claimed) return

  let client: ImapFlow | null = null
  let highestUid = claimed.last_uid
  let uidValidity = claimed.uid_validity
  let processed = 0
  let matched = 0

  try {
    const credentials = resolveImapCredentials(account)
    client = new ImapFlow({
      host: account.imap_host,
      port: account.imap_port,
      secure: account.imap_port === 993,
      auth: credentials,
      logger: false,
      connectionTimeout: 15_000,
    })

    // Without this listener, an async 'error' emitted after connect()/logout()
    // has already settled (e.g. a mid-handshake socket close racing imapflow's
    // internal session retry) is unhandled and crashes the whole process.
    client.on("error", (err) => {
      log.warn("imap client error", { accountId: account.id, error: err instanceof Error ? err.message : String(err) })
    })

    await client.connect()
    const lock = await client.getMailboxLock(MAILBOX)

    try {
      const mailboxMeta = client.mailbox && typeof client.mailbox === "object" ? (client.mailbox as { uidValidity?: unknown; uidvalidity?: unknown }) : null
      uidValidity = Number(mailboxMeta?.uidValidity ?? mailboxMeta?.uidvalidity ?? uidValidity ?? 0) || null
      const mailboxUidNext = Number(
        mailboxMeta && "uidNext" in mailboxMeta ? mailboxMeta.uidNext : 0
      )
      if (!claimed.uid_validity && claimed.last_uid === 0 && mailboxUidNext > 0) {
        // New monitors start at the current mailbox edge instead of ingesting unrelated history.
        highestUid = mailboxUidNext - 1
      } else if (claimed.uid_validity && uidValidity && claimed.uid_validity !== uidValidity) {
        highestUid = Math.max(0, mailboxUidNext - 1)
      }

      const range = `${highestUid + 1}:*`
      for await (const message of client.fetch(range, { source: true, uid: true }, { uid: true })) {
        const uid = Number(message.uid)
        if (!uid || !message.source) continue
        const didMatch = await processMessage(account.id, Buffer.from(message.source), uid, uidValidity)
        highestUid = Math.max(highestUid, uid)
        processed += 1
        if (didMatch) matched += 1

        await supabaseAdmin
          .from("email_account_mailbox_syncs")
          .update({ last_uid: highestUid, uid_validity: uidValidity, last_synced_at: new Date().toISOString(), updated_at: new Date().toISOString() })
          .eq("id", claimed.id)

        if (processed >= MAX_MESSAGES_PER_ACCOUNT) break
      }
    } finally {
      lock.release()
    }

    await client.logout()
    await releaseSync(claimed.id, { last_uid: highestUid, uid_validity: uidValidity, last_synced_at: new Date().toISOString(), last_error: null })
    log.info("mailbox sync complete", { accountId: account.id, processed, matched, lastUid: highestUid })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    log.warn("mailbox sync failed", { accountId: account.id, error: message })

    await releaseSync(claimed.id, { last_uid: highestUid, uid_validity: uidValidity, last_error: message.slice(0, 1000) })
    if (client) {
      try {
        await client.logout()
      } catch {
        // The original sync error is the actionable failure.
      }
    }
  }
}

export async function runProspectOutreachMonitor(userId?: string): Promise<void> {
  if (userId) {
    const prospectIds = await loadProspectIdsForUser(userId)
    if (!prospectIds.length) {
      log.info("no prospects for user", { userId })
      return
    }

    const { data: sequences, error: sequencesError } = await supabaseAdmin
      .from("prospect_sequences")
      .select("email_account_id")
      .in("prospect_id", prospectIds)

    if (sequencesError) {
      log.error("failed to load sequences for user", { userId, error: sequencesError.message })
      return
    }

    const accountIds = [...new Set(sequences?.map((s) => s.email_account_id) ?? [])]
    if (!accountIds.length) {
      log.info("no email accounts used by user's prospects", { userId })
      return
    }

    // NB: public-pool accounts are shared, so this also surfaces inbound mail
    // for other free users on the same mailbox — expected for the shared pool.
    const { data: accounts, error } = await supabaseAdmin
      .from("email_accounts")
      .select("id, email, imap_host, imap_port, imap_user, imap_pass, smtp_user, smtp_pass, status")
      .in("id", accountIds)
      .not("imap_host", "is", null)
      .not("imap_port", "is", null)

    if (error) {
      log.error("failed to load email accounts for monitoring", { userId, error: error.message })
      return
    }

    if (!accounts?.length) {
      log.info("no email accounts for user configured for monitoring", { userId })
      return
    }

    for (const account of accounts) {
      await processAccount(account)
    }
    return
  }

  const { count } = await supabaseAdmin
    .from("email_accounts")
    .select("id", { count: "exact", head: true })
    .not("imap_host", "is", null)
    .not("imap_port", "is", null)

  const accountCount = count ?? 0
  if (accountCount === 0) {
    log.info("no email accounts configured for monitoring")
    return
  }

  const pageCount = Math.ceil(accountCount / MAX_ACCOUNTS_PER_TICK)
  const tickNumber = Math.floor(Date.now() / (5 * 60 * 1000))
  const offset = (tickNumber % pageCount) * MAX_ACCOUNTS_PER_TICK
  const { data: accounts, error } = await supabaseAdmin
    .from("email_accounts")
    .select("id, email, imap_host, imap_port, imap_user, imap_pass, smtp_user, smtp_pass, status")
    .not("imap_host", "is", null)
    .not("imap_port", "is", null)
    .order("id", { ascending: true })
    .range(offset, Math.min(offset + MAX_ACCOUNTS_PER_TICK - 1, accountCount - 1))

  if (error) {
    log.error("failed to load email accounts for monitoring", { error: error.message })
    return
  }

  if (!accounts?.length) {
    log.info("no email accounts configured for monitoring")
    return
  }

  for (const account of accounts) {
    await processAccount(account)
  }
}
