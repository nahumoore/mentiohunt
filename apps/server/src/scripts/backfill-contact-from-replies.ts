/**
 * One-off backfill: fill `backlink_prospects.contact_name` for prospects whose
 * inbound replies already landed before the outreach monitor learned to copy
 * the sender's display name onto the prospect (see enrich-contact-from-reply).
 * Those prospects show "Unknown contact" in the dashboard even though a named
 * human personally replied.
 *
 * Only touches prospects whose current `contact_name` does not survive
 * `sanitizeContactName` — i.e. null, empty, or a placeholder like "unknown".
 * A real, previously-enriched name is never overwritten (the shared helper
 * re-checks this before every write).
 *
 * Usage:
 *   pnpm --filter server exec tsx src/scripts/backfill-contact-from-replies.ts --dry-run
 *   pnpm --filter server exec tsx src/scripts/backfill-contact-from-replies.ts
 */
// Must precede the supabase import — it reads env vars at module load.
import "../env.js"
import { supabaseAdmin } from "@workspace/supabase/admin"
import {
  CONTACT_ENRICHABLE_CLASSIFICATIONS,
  enrichContactFromReply,
} from "../helpers/outreach/enrich-contact-from-reply.js"
import { createLogger } from "../helpers/logger.js"
import { sanitizeContactName } from "../methods/prospect-generation-methods/shared/contact-name.js"

const log = createLogger("backfill-contact-from-replies")

const dryRun = process.argv.includes("--dry-run")
const PAGE_SIZE = 1000
const PROSPECT_CHUNK = 200

type ReplyRow = {
  prospect_id: string
  sequence_id: string | null
  email_account_id: string | null
  from_name: string | null
  from_email: string | null
  received_at: string
}

/** Every inbound reply written by a real person, oldest first — the earliest
 * named reply is the one most likely to be the contact we actually emailed. */
async function loadHumanReplies(): Promise<ReplyRow[]> {
  const rows: ReplyRow[] = []

  for (let from = 0; ; from += PAGE_SIZE) {
    const { data, error } = await supabaseAdmin
      .from("prospect_messages")
      .select("prospect_id, sequence_id, email_account_id, from_name, from_email, received_at")
      .eq("direction", "inbound")
      .in("classification", [...CONTACT_ENRICHABLE_CLASSIFICATIONS])
      .not("from_name", "is", null)
      .order("received_at", { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw new Error(`failed to load inbound replies: ${error.message}`)
    if (!data?.length) break

    rows.push(...data)
    if (data.length < PAGE_SIZE) break
  }

  return rows
}

/** Current contact names for the prospects those replies belong to. */
async function loadContactNames(prospectIds: string[]): Promise<Map<string, string | null>> {
  const names = new Map<string, string | null>()

  for (let i = 0; i < prospectIds.length; i += PROSPECT_CHUNK) {
    const chunk = prospectIds.slice(i, i + PROSPECT_CHUNK)
    const { data, error } = await supabaseAdmin
      .from("backlink_prospects")
      .select("id, contact_name")
      .in("id", chunk)

    if (error) throw new Error(`failed to load prospects: ${error.message}`)
    for (const prospect of data ?? []) names.set(prospect.id, prospect.contact_name)
  }

  return names
}

async function main(): Promise<void> {
  const replies = await loadHumanReplies()
  if (!replies.length) {
    log.info("no inbound human replies found", { dryRun })
    return
  }

  const contactNames = await loadContactNames([...new Set(replies.map((reply) => reply.prospect_id))])

  // One candidate per prospect: the earliest reply whose display name survives
  // the sanitizer. Replies are already oldest-first, so the first hit wins.
  const candidates = new Map<string, { reply: ReplyRow; name: string; currentName: string | null }>()
  for (const reply of replies) {
    if (candidates.has(reply.prospect_id)) continue
    if (!contactNames.has(reply.prospect_id)) continue

    const currentName = contactNames.get(reply.prospect_id) ?? null
    if (sanitizeContactName(currentName)) continue

    const name = sanitizeContactName(reply.from_name)
    if (!name) continue

    candidates.set(reply.prospect_id, { reply, name, currentName })
  }

  log.info("scanned inbound replies", {
    dryRun,
    replies: replies.length,
    prospectsWithReplies: contactNames.size,
    prospectsToBackfill: candidates.size,
  })

  let updated = 0
  for (const [prospectId, candidate] of candidates) {
    if (dryRun) {
      log.info("would backfill contact name", {
        prospectId,
        currentName: candidate.currentName,
        newName: candidate.name,
        fromEmail: candidate.reply.from_email,
        receivedAt: candidate.reply.received_at,
      })
      continue
    }

    const written = await enrichContactFromReply({
      prospectId,
      sequenceId: candidate.reply.sequence_id,
      emailAccountId: candidate.reply.email_account_id,
      fromName: candidate.reply.from_name,
      fromEmail: candidate.reply.from_email,
    })

    if (written) updated += 1
  }

  log.info("backfill complete", { dryRun, candidates: candidates.size, updated })
}

main().catch((err) => {
  log.error("backfill failed", { error: err instanceof Error ? err.message : String(err) })
  process.exit(1)
})
