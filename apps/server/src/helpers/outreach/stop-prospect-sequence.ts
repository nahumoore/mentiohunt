import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json } from "@workspace/supabase/database-types"
import { createLogger } from "../logger.js"
import { normalizeEmail } from "./inbound-email.js"

const log = createLogger("stop-prospect-sequence")

type StopReason = "reply" | "bounce" | "unsubscribe" | "stop_request" | "wrong_person" | "suppressed_recipient"

function toJson(value: Record<string, unknown>): Json {
  return value as Json
}

export async function stopProspectSequence({
  prospectId,
  sequenceId,
  emailAccountId,
  recipientEmail,
  reason,
  eventType,
  prospectStatus,
  suppress,
  metadata,
}: {
  prospectId: string
  sequenceId: string | null
  emailAccountId: string | null
  recipientEmail?: string | null
  reason: StopReason
  eventType: string
  prospectStatus?: "negotiating" | "email_not_found" | "bounced"
  suppress?: boolean
  metadata?: Record<string, unknown>
}): Promise<void> {
  const { error } = await supabaseAdmin.rpc("stop_prospect_outreach", {
    p_prospect_id: prospectId,
    p_sequence_id: sequenceId,
    p_email_account_id: emailAccountId,
    p_recipient_email: normalizeEmail(recipientEmail),
    p_reason: reason,
    p_event_type: eventType,
    p_prospect_status: prospectStatus ?? null,
    p_suppress: suppress ?? false,
    p_metadata: metadata ? toJson(metadata) : {},
  })

  if (error) {
    log.error("failed to stop prospect outreach transaction", {
      prospectId,
      sequenceId,
      reason,
      error: error.message,
    })
    throw new Error(error.message)
  }
}
