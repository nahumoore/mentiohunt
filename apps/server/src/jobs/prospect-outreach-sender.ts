import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json, Tables } from "@workspace/supabase/database-types"
import {
  buildCapacityReschedule,
  isWithinUtcSendWindow,
} from "../helpers/emails/outreach-schedule.js"
import {
  sendOutreachEmail,
  type OutreachEmailAccount,
} from "../helpers/emails/send-outreach-email.js"
import { createLogger } from "../helpers/logger.js"
import { stopProspectSequence } from "../helpers/outreach/stop-prospect-sequence.js"

const log = createLogger("prospect-outreach-sender")

const MAX_ROWS_TO_SCAN = 30
const MAX_SENDS_PER_TICK = 8

type ProspectSequence = Pick<
  Tables<"prospect_sequences">,
  | "id"
  | "prospect_id"
  | "email_account_id"
  | "step"
  | "subject"
  | "body"
  | "attempt_count"
>

type ClaimedSequence = ProspectSequence & Pick<Tables<"prospect_sequences">, "status">

type ProspectContext = Pick<
  Tables<"backlink_prospects">,
  "id" | "product_id" | "contact_email" | "status"
>

type ProductContext = Pick<Tables<"products">, "id" | "user_id" | "product_name" | "website_url">

type AccountContext = OutreachEmailAccount & Pick<Tables<"email_accounts">, "daily_send_cap" | "status">

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json
}

function isAccountConfigurationError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return /auth|login|credential|password|username|ea?uth|invalid user|invalid login|missing smtp configuration|invalid encrypted payload/i.test(
    message
  )
}

/** Prospect ids owned (via product) by a given user — covers both a paid
 * user's own mailbox and a free user's shared public-pool sends, since
 * ownership lives on the prospect/product, not on email_accounts.user_id. */
export async function loadProspectIdsForUser(userId: string): Promise<string[]> {
  const { data: products } = await supabaseAdmin.from("products").select("id").eq("user_id", userId)
  const productIds = products?.map((p) => p.id) ?? []
  if (!productIds.length) return []

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id")
    .in("product_id", productIds)

  return prospects?.map((p) => p.id) ?? []
}

const STALE_LOCK_MINUTES = 10

async function failStaleLocks(): Promise<void> {
  const staleBefore = new Date(Date.now() - STALE_LOCK_MINUTES * 60 * 1000).toISOString()
  const { data, error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "failed", locked_at: null, last_error: "Delivery outcome unknown after worker interruption; not retried to prevent duplicates." })
    .eq("status", "sending")
    .lt("locked_at", staleBefore)
    .select("id, prospect_id, step")

  if (error) {
    log.warn("failed to close stale locked sequences", { error: error.message })
    return
  }

  if (data?.length) {
    for (const sequence of data) {
      await supabaseAdmin
        .from("prospect_sequences")
        .update({ status: "skipped", last_error: "Previous delivery outcome is unknown." })
        .eq("prospect_id", sequence.prospect_id)
        .gt("step", sequence.step)
        .eq("status", "pending")
    }
    log.warn("marked stale sends as delivery-unknown", { count: data.length, ids: data.map((row) => row.id) })
  }
}

async function recordEvent({
  sequence,
  accountId,
  eventType,
  recipientEmail,
  metadata,
}: {
  sequence: Pick<ProspectSequence, "id" | "prospect_id">
  accountId: string | null
  eventType: string
  recipientEmail?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin.from("outreach_events").insert({
    prospect_id: sequence.prospect_id,
    sequence_id: sequence.id,
    email_account_id: accountId,
    event_type: eventType,
    recipient_email: recipientEmail ?? null,
    metadata: metadata ? toJson(metadata) : null,
  })

  if (error) {
    log.warn("failed to record outreach event", { sequenceId: sequence.id, eventType, error: error.message })
  }
}

async function deferForAccountSpacing(sequence: ProspectSequence): Promise<void> {
  const scheduledAt = buildCapacityReschedule().toISOString()
  const { error } = await supabaseAdmin
    .from("prospect_sequences")
    .update({ scheduled_at: scheduledAt, last_deferred_at: new Date().toISOString() })
    .eq("id", sequence.id)
    .eq("status", "pending")

  if (error) {
    log.warn("failed to defer sequence for account spacing", { sequenceId: sequence.id, error: error.message })
    return
  }

  await recordEvent({
    sequence,
    accountId: sequence.email_account_id,
    eventType: "account_spacing_deferred",
    metadata: { scheduledAt },
  })
}

async function claimSequence(sequence: ProspectSequence): Promise<ClaimedSequence | null> {
  const { data, error } = await supabaseAdmin.rpc("claim_prospect_outreach_sequence", {
    p_sequence_id: sequence.id,
    p_spacing_seconds: 300,
  })

  if (error) {
    log.warn("failed to claim sequence", { sequenceId: sequence.id, error: error.message })
    return null
  }

  return data?.[0] ?? null
}

async function loadContext(sequence: ProspectSequence): Promise<{
  prospect: ProspectContext
  product: ProductContext
  account: AccountContext
  senderName: string | null
  signature: string | null
  previousMessageId: string | null
  ownerEligible: boolean
} | null> {
  const { data: prospect, error: prospectError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, product_id, contact_email, status")
    .eq("id", sequence.prospect_id)
    .maybeSingle()

  if (prospectError || !prospect) {
    log.warn("missing prospect for sequence", { sequenceId: sequence.id, error: prospectError?.message })
    return null
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, website_url")
    .eq("id", prospect.product_id)
    .maybeSingle()

  if (productError || !product) {
    log.warn("missing product for sequence", { sequenceId: sequence.id, productId: prospect.product_id, error: productError?.message })
    return null
  }

  const { data: outreachSettings } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("signature_enabled, signature_text")
    .eq("product_id", product.id)
    .maybeSingle()

  const fallbackSignature = [product.product_name, product.website_url].filter(Boolean).join("\n")
  const signature = outreachSettings?.signature_enabled
    ? outreachSettings.signature_text?.trim() || fallbackSignature
    : null

  const { data: account, error: accountError } = await supabaseAdmin
    .from("email_accounts")
    .select("id, email, name, is_public, smtp_host, smtp_port, smtp_user, smtp_pass, daily_send_cap, status")
    .eq("id", sequence.email_account_id)
    .maybeSingle()

  if (accountError || !account || account.status !== "active") {
    log.warn("email account unavailable for sequence", { sequenceId: sequence.id, accountId: sequence.email_account_id, error: accountError?.message })
    return null
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("name, email, tier, active_trial")
    .eq("id", product.user_id)
    .maybeSingle()

  const senderName = profile?.name?.trim() || profile?.email?.split("@")[0] || null
  const ownerEligible = profile !== undefined && profile !== null && (profile.tier !== "free" || profile.active_trial)
  let previousMessageId: string | null = null
  if (sequence.step > 1) {
    const { data: previous } = await supabaseAdmin
      .from("prospect_sequences")
      .select("message_id")
      .eq("prospect_id", sequence.prospect_id)
      .lt("step", sequence.step)
      .eq("status", "sent")
      .order("step", { ascending: false })
      .limit(1)
      .maybeSingle()
    previousMessageId = previous?.message_id ?? null
  }

  return { prospect, product, account, senderName, signature, previousMessageId, ownerEligible }
}

async function isSuppressed(email: string): Promise<boolean> {
  const { data } = await supabaseAdmin
    .from("email_suppressions")
    .select("id")
    .eq("email", normalizeEmail(email))
    .maybeSingle()

  return !!data
}

async function markDeliveryFailed(sequence: ClaimedSequence, error: unknown): Promise<void> {
  const message = error instanceof Error ? error.message : String(error)
  await supabaseAdmin
    .from("prospect_sequences")
    .update({
    status: "failed",
    locked_at: null,
    last_error: `Delivery failed or is uncertain; not retried automatically: ${message}`.slice(0, 1000),
  })
    .eq("id", sequence.id)

  await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "skipped", last_error: "Previous sequence step failed." })
    .eq("prospect_id", sequence.prospect_id)
    .gt("step", sequence.step)
    .eq("status", "pending")

  await recordEvent({
    sequence,
    accountId: sequence.email_account_id,
    eventType: "delivery_failed_or_unknown",
    metadata: { error: message, attemptCount: sequence.attempt_count },
  })
}

async function skipSequence(sequence: ClaimedSequence, reason: string, recipientEmail?: string | null): Promise<void> {
  await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "skipped", locked_at: null, last_error: reason })
    .eq("id", sequence.id)

  await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "skipped", last_error: "Previous sequence step was skipped." })
    .eq("prospect_id", sequence.prospect_id)
    .gt("step", sequence.step)
    .eq("status", "pending")

  await recordEvent({
    sequence,
    accountId: sequence.email_account_id,
    eventType: "skipped",
    recipientEmail,
    metadata: { reason },
  })
}

/** Owner went ineligible after the sequence was already scheduled (e.g. cron ran
 * before the pause webhook fired). Must land on "trial_expired", not "skipped" —
 * only "trial_expired" rows are picked up by the resume sweep/Stripe webhook in
 * trial-sequences.ts, so anything marked "skipped" here would stay stuck forever
 * even after the owner upgrades. */
async function pauseSequenceForTrialExpiry(sequence: ClaimedSequence, recipientEmail?: string | null): Promise<void> {
  await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "trial_expired", locked_at: null, last_error: "Owner's free trial has expired." })
    .eq("id", sequence.id)

  await supabaseAdmin
    .from("prospect_sequences")
    .update({ status: "trial_expired", last_error: "Owner's free trial has expired." })
    .eq("prospect_id", sequence.prospect_id)
    .gt("step", sequence.step)
    .eq("status", "pending")

  await recordEvent({
    sequence,
    accountId: sequence.email_account_id,
    eventType: "trial_expired",
    recipientEmail,
  })
}

async function processSequence(sequence: ProspectSequence): Promise<boolean> {
  const claimed = await claimSequence(sequence)
  if (!claimed) {
    await deferForAccountSpacing(sequence)
    return false
  }

  try {
    const context = await loadContext(claimed)
    if (!context) {
      await skipSequence(claimed, "Missing prospect, product, profile, or active email account.")
      return false
    }

    const recipientEmail = context.prospect.contact_email ? normalizeEmail(context.prospect.contact_email) : null
    if (!recipientEmail || !claimed.subject?.trim() || !claimed.body?.trim()) {
      await skipSequence(claimed, "Missing recipient, subject, or body.", recipientEmail)
      return false
    }

    if (!context.ownerEligible) {
      await pauseSequenceForTrialExpiry(claimed, recipientEmail)
      return false
    }

    const subject = claimed.subject.trim()
    const body = claimed.body.trim()

    if (await isSuppressed(recipientEmail)) {
      await stopProspectSequence({
        prospectId: claimed.prospect_id,
        sequenceId: claimed.id,
        emailAccountId: claimed.email_account_id,
        recipientEmail,
        reason: "suppressed_recipient",
        eventType: "suppressed_recipient_detected",
      })
      return false
    }

    try {
      const result = await sendOutreachEmail({
        account: context.account,
        senderName: context.senderName,
        sequenceId: claimed.id,
        to: recipientEmail,
        subject,
        body,
        signature: context.signature,
        inReplyTo: context.previousMessageId,
      })

      const now = new Date().toISOString()
      const { error: updateError } = await supabaseAdmin
        .from("prospect_sequences")
        .update({
          status: "sent",
          sent_at: now,
          locked_at: null,
          last_error: null,
          message_id: result.messageId,
          provider_response: result.response as Json,
        })
        .eq("id", claimed.id)

      if (updateError) throw new Error(updateError.message)

      await supabaseAdmin.from("prospect_messages").insert({
        prospect_id: claimed.prospect_id,
        sequence_id: claimed.id,
        email_account_id: context.account.id,
        direction: "outbound",
        classification: "sent",
        message_id: result.messageId,
        in_reply_to: context.previousMessageId,
        references: context.previousMessageId ? [context.previousMessageId] : null,
        from_email: context.account.email,
        from_name: context.senderName,
        to_emails: [recipientEmail],
        subject,
        text_body: body,
        received_at: now,
      })

      if (claimed.step === 1 && context.prospect.status === "new") {
        await supabaseAdmin
          .from("backlink_prospects")
          .update({ status: "contacted" })
          .eq("id", context.prospect.id)
          .eq("status", "new")
      }

      await recordEvent({
        sequence: claimed,
        accountId: context.account.id,
        eventType: "sent",
        recipientEmail,
        metadata: { messageId: result.messageId, step: claimed.step },
      })
      log.success("sent prospect outreach email", { sequenceId: claimed.id, prospectId: claimed.prospect_id, step: claimed.step })
      return true
    } catch (error) {
      log.warn("failed to send prospect outreach email", { sequenceId: claimed.id, error: String(error) })

      if (isAccountConfigurationError(error)) {
        await supabaseAdmin
          .from("email_accounts")
          .update({ status: "error", error_message: String(error).slice(0, 1000) })
          .eq("id", context.account.id)
      }

      await markDeliveryFailed(claimed, error)
      return false
    }
  } catch (error) {
    log.warn("unexpected error processing prospect sequence", { sequenceId: claimed.id, error: String(error) })
    await markDeliveryFailed(claimed, error)
    return false
  }
}

export async function runProspectOutreachSender(userId?: string, bypassSendWindow = false): Promise<void> {
  await failStaleLocks()

  if (!bypassSendWindow && !isWithinUtcSendWindow()) {
    log.info("outside UTC send window")
    return
  }

  let prospectIds: string[] | null = null
  if (userId) {
    prospectIds = await loadProspectIdsForUser(userId)
    if (!prospectIds.length) {
      log.info("no prospects for user", { userId })
      return
    }
  }

  const batchLimit = Math.max(1, MAX_SENDS_PER_TICK - Math.floor(Math.random() * 3))
  let query = supabaseAdmin
    .from("prospect_sequences")
    .select("id, prospect_id, email_account_id, step, subject, body, attempt_count")
    .eq("status", "pending")
    .lte("scheduled_at", new Date().toISOString())
    // Order by created_at, not scheduled_at: spacing-deferrals rewrite scheduled_at
    // to a random future slot, which would let newer sequences queue-jump older ones.
    .order("created_at", { ascending: true })
    .limit(MAX_ROWS_TO_SCAN)

  if (prospectIds) {
    query = query.in("prospect_id", prospectIds)
  }

  const { data: dueSequences, error } = await query

  if (error) {
    log.error("failed to fetch due sequences", { error: error.message })
    return
  }

  if (!dueSequences?.length) {
    log.info("no due prospect sequences")
    return
  }

  const sentAccountIds = new Set<string>()
  let sendsThisTick = 0

  for (const sequence of dueSequences) {
    if (sendsThisTick >= batchLimit) break

    if (sentAccountIds.has(sequence.email_account_id)) {
      await deferForAccountSpacing(sequence)
      continue
    }

    const sent = await processSequence(sequence)
    if (sent) {
      sentAccountIds.add(sequence.email_account_id)
      sendsThisTick += 1
    }
  }

  log.info("sender tick complete", { scanned: dueSequences.length, sent: sendsThisTick, accountsUsed: sentAccountIds.size, batchLimit })
}
