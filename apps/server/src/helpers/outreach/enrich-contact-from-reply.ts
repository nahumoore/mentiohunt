/**
 * Backfills `backlink_prospects.contact_name` from an inbound reply's display
 * name. When outreach-time enrichment never found a person (or found garbage),
 * the prospect stays "Unknown contact" in the dashboard even after a named
 * human personally wrote back — the identity signal arrives with the reply and
 * was previously only stored on `prospect_messages`.
 *
 * Only fills a name that is currently missing or unusable; a real,
 * previously-enriched name is never overwritten.
 */
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json } from "@workspace/supabase/database-types"
import { sanitizeContactName } from "../../methods/prospect-generation-methods/shared/contact-name.js"
import { createLogger } from "../logger.js"
import type { InboundClassification } from "./inbound-email.js"

const log = createLogger("enrich-contact-from-reply")

/**
 * Classifications where a real person demonstrably typed the reply, so the
 * display name describes the human behind the address we emailed.
 *
 * `wrong_person` is included: they are still a real person at that address, and
 * "not the right decision-maker" is carried by the prospect's status and
 * stop-reason, not by the contact name. `unsubscribe` is excluded — that
 * address is suppressed permanently, so enriching it buys nothing. Bounces,
 * auto-replies, and challenges aren't people at all. `needs_review` is
 * included because the monitor now treats it the same as `human_reply`.
 */
export const CONTACT_ENRICHABLE_CLASSIFICATIONS = new Set<InboundClassification>([
  "human_reply",
  "negative_reply",
  "wrong_person",
  "needs_review",
])

/**
 * Copy the inbound sender's display name onto the prospect when we don't
 * already have a usable one. Returns the name that is now stored, or null when
 * nothing was written (already had a real name, or the display name was
 * unusable).
 */
export async function enrichContactFromReply({
  prospectId,
  sequenceId,
  emailAccountId,
  fromName,
  fromEmail,
}: {
  prospectId: string
  sequenceId?: string | null
  emailAccountId?: string | null
  fromName: string | null
  fromEmail?: string | null
}): Promise<string | null> {
  // Display names are frequently unusable — "support@site.com", "Acme Media
  // Team", "Newsletter". The same guard used at outreach time rejects those.
  const candidate = sanitizeContactName(fromName)
  if (!candidate) return null

  // Re-read rather than trusting the row loaded earlier in the tick, so a name
  // written by a concurrent enrichment isn't clobbered.
  const { data: prospect, error: loadError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("contact_name")
    .eq("id", prospectId)
    .maybeSingle()

  if (loadError || !prospect) {
    log.warn("failed to load prospect for contact backfill", { prospectId, error: loadError?.message })
    return null
  }

  // A current value that survives the sanitizer is real, previously-enriched
  // data. Placeholders ("unknown", "n/a", "team", "admin") do not survive it,
  // so this single check covers both guards in the ticket.
  const existing = sanitizeContactName(prospect.contact_name)
  if (existing) return null

  const { error: updateError } = await supabaseAdmin
    .from("backlink_prospects")
    .update({ contact_name: candidate })
    .eq("id", prospectId)

  if (updateError) {
    log.warn("failed to backfill contact name from reply", { prospectId, error: updateError.message })
    return null
  }

  const { error: eventError } = await supabaseAdmin.from("outreach_events").insert({
    prospect_id: prospectId,
    sequence_id: sequenceId ?? null,
    email_account_id: emailAccountId ?? null,
    event_type: "contact_enriched_from_reply",
    recipient_email: fromEmail ?? null,
    metadata: {
      field: "contact_name",
      previousValue: prospect.contact_name,
      newValue: candidate,
      source: "inbound_reply_display_name",
    } as Json,
  })

  if (eventError) {
    log.warn("failed to record contact enrichment event", { prospectId, error: eventError.message })
  }

  log.info("backfilled contact name from inbound reply", {
    prospectId,
    previousValue: prospect.contact_name,
    newValue: candidate,
  })

  return candidate
}
