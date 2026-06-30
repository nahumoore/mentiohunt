import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../helpers/logger.js"
import type { ProspectCreatedPayload } from "../../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { resolveEmailAccount } from "./resolve-email-account.js"

const log = createLogger("onboarding-prospect-sequences")

function buildFollowupBodies(
  firstName: string,
  senderFirstName: string
): { step2Body: string; step3Body: string } {
  return {
    step2Body: `Hi ${firstName},\n\nWanted to reach out once more — happy to share more details if helpful.\n\nBest,\n${senderFirstName}`,
    step3Body: `Hi ${firstName},\n\nLast note from me — if timing ever works out, I'd love to connect.\n\nBest,\n${senderFirstName}\n\nP.S. No hard feelings if it's not a fit — I won't follow up after this.`,
  }
}

/**
 * Generate and insert the 3-step email sequence for a single prospect immediately
 * after it is inserted. Called from the `onProspectCreated` callback during discovery.
 */
export async function createSequencesForProspect(
  prospect: ProspectCreatedPayload,
  account: { id: string; name: string | null }
): Promise<void> {
  const now = new Date()
  const hour1 = new Date(now.getTime() + 60 * 60 * 1000)
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const reSubject = prospect.emailSubject ? `Re: ${prospect.emailSubject}` : null
  const firstName = prospect.contactName?.split(" ")[0] ?? "there"
  const senderFirstName = account.name?.split(" ")[0] ?? ""

  const { step2Body, step3Body } = buildFollowupBodies(firstName, senderFirstName)

  const { error: seqError } = await supabaseAdmin
    .from("prospect_sequences")
    .insert([
      {
        prospect_id: prospect.id,
        email_account_id: account.id,
        step: 1,
        subject: prospect.emailSubject,
        body: prospect.emailBody,
        scheduled_at: hour1.toISOString(),
      },
      {
        prospect_id: prospect.id,
        email_account_id: account.id,
        step: 2,
        subject: reSubject,
        body: prospect.step2Body ?? step2Body,
        scheduled_at: day3.toISOString(),
      },
      {
        prospect_id: prospect.id,
        email_account_id: account.id,
        step: 3,
        subject: reSubject,
        body: prospect.step3Body ?? step3Body,
        scheduled_at: day7.toISOString(),
      },
    ])

  if (seqError) {
    log.error("createSequencesForProspect: failed to insert sequences", {
      prospectId: prospect.id,
      error: seqError.message,
    })
    return
  }

  const { error: updateError } = await supabaseAdmin
    .from("backlink_prospects")
    .update({ email_account_id: account.id })
    .eq("id", prospect.id)

  if (updateError) {
    log.error("createSequencesForProspect: failed to update prospect email_account_id", {
      prospectId: prospect.id,
      error: updateError.message,
    })
    return
  }

  log.success("createSequencesForProspect done", { prospectId: prospect.id })
}

/**
 * Safety-net sweep: assigns sequences to any prospects that don't have one yet.
 * Catches prospects whose per-prospect sequence insert failed during discovery.
 */
export async function assignSequences(
  userId: string,
  productId: string,
  resolvedAccount?: { id: string; name: string | null } | null
): Promise<void> {
  const account = resolvedAccount !== undefined ? resolvedAccount : await resolveEmailAccount(userId)

  if (!account) {
    log.warn("assignSequences: no email account available, skipping", { userId, productId })
    return
  }

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, contact_name, email_subject, email_body")
    .eq("product_id", productId)
    .is("email_account_id", null)

  if (!prospects?.length) {
    log.info("assignSequences: no unassigned prospects", { productId })
    return
  }

  log.info("assignSequences START", { productId, count: prospects.length, accountId: account.id })

  const now = new Date()
  const hour1 = new Date(now.getTime() + 60 * 60 * 1000)
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const senderFirstName = account.name?.split(" ")[0] ?? ""

  const sequences = prospects.flatMap((p) => {
    const reSubject = p.email_subject ? `Re: ${p.email_subject}` : null
    const firstName = p.contact_name?.split(" ")[0] ?? "there"
    const { step2Body, step3Body } = buildFollowupBodies(firstName, senderFirstName)

    return [
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 1,
        subject: p.email_subject,
        body: p.email_body,
        scheduled_at: hour1.toISOString(),
      },
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 2,
        subject: reSubject,
        body: step2Body,
        scheduled_at: day3.toISOString(),
      },
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 3,
        subject: reSubject,
        body: step3Body,
        scheduled_at: day7.toISOString(),
      },
    ]
  })

  const { error: seqError } = await supabaseAdmin
    .from("prospect_sequences")
    .insert(sequences)

  if (seqError) {
    log.error("assignSequences: failed to insert sequences", { productId, error: seqError.message })
    return
  }

  const { error: updateError } = await supabaseAdmin
    .from("backlink_prospects")
    .update({ email_account_id: account.id })
    .eq("product_id", productId)
    .is("email_account_id", null)

  if (updateError) {
    log.error("assignSequences: failed to update prospects", { productId, error: updateError.message })
    return
  }

  log.success("assignSequences done", { productId, sequences: sequences.length })
}
