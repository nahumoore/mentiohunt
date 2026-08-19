/**
 * One-off backfill: redistribute prospects currently glued to an overloaded
 * public-pool sending account (e.g. everything assigned before we added more
 * pool accounts) across all active public accounts.
 *
 * Only moves prospects that are still `status = "new"` with NOTHING sent yet
 * — all 3 of their prospect_sequences rows are still `pending` (no sent/
 * sending/failed/skipped/bounced/paused/trial_expired/account_paused step).
 * This guarantees we never split a prospect's steps across two inboxes
 * (breaks reply threading) and never touch something already in flight.
 *
 * Also skips prospects owned by a free-tier user with no active trial —
 * moving them to a fresher account wouldn't help, the sender's ownerEligible
 * check (prospect-outreach-sender.ts) will just re-park them as
 * trial_expired regardless of which account they're on.
 *
 * Distribution is greedy least-loaded: starts from each account's current
 * total assignment count (step=1 row count) and hands each candidate to
 * whichever account has the fewest so far, updating the running count as it
 * goes — same metric the live picker (resolve-email-account.ts) now uses.
 *
 * scheduled_at is left untouched; already-due rows get picked up by the
 * sender cron on their new account next tick.
 *
 * Usage:
 *   pnpm --filter server exec tsx src/scripts/backfill-rebalance-outreach-accounts.ts --dry-run
 *   pnpm --filter server exec tsx src/scripts/backfill-rebalance-outreach-accounts.ts
 */
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("backfill-rebalance-outreach-accounts")

const dryRun = process.argv.includes("--dry-run")
const CHUNK_SIZE = 200

function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size))
  return out
}

const PAGE_SIZE = 1000

/** Supabase/PostgREST caps a single select at 1000 rows by default — page
 * through with .range() so counts and candidate lists aren't silently
 * truncated on tables this size. */
async function fetchAllPages<T>(
  runPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>
): Promise<T[]> {
  const all: T[] = []
  let from = 0
  for (;;) {
    const { data, error } = await runPage(from, from + PAGE_SIZE - 1)
    if (error) throw new Error(error.message)
    if (!data?.length) break
    all.push(...data)
    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }
  return all
}

async function main() {
  const { data: publicAccounts, error: accountsError } = await supabaseAdmin
    .from("email_accounts")
    .select("id, name, daily_send_cap")
    .eq("is_public", true)
    .eq("status", "active")

  if (accountsError) throw new Error(`failed to load public accounts: ${accountsError.message}`)
  if (!publicAccounts || publicAccounts.length < 2) {
    log.info("fewer than 2 active public accounts, nothing to rebalance", {
      count: publicAccounts?.length ?? 0,
    })
    return
  }

  const accountIds = publicAccounts.map((a) => a.id)

  const totalAssignedRows = await fetchAllPages<{ email_account_id: string }>((from, to) =>
    supabaseAdmin
      .from("prospect_sequences")
      .select("email_account_id")
      .in("email_account_id", accountIds)
      .eq("step", 1)
      .range(from, to)
  )

  const runningTotals = new Map<string, number>(publicAccounts.map((a) => [a.id, 0]))
  for (const row of totalAssignedRows) {
    runningTotals.set(row.email_account_id, (runningTotals.get(row.email_account_id) ?? 0) + 1)
  }

  log.info(dryRun ? "dry-run start" : "backfill start", {
    accounts: publicAccounts.map((a) => ({ id: a.id, name: a.name, current: runningTotals.get(a.id) })),
  })

  const newProspects = await fetchAllPages<{ id: string; email_account_id: string | null; product_id: string }>(
    (from, to) =>
      supabaseAdmin
        .from("backlink_prospects")
        .select("id, email_account_id, product_id")
        .in("email_account_id", accountIds)
        .eq("status", "new")
        .range(from, to)
  )

  if (!newProspects.length) {
    log.info("no status=new prospects currently assigned to public accounts")
    return
  }

  const productIds = [...new Set(newProspects.map((p) => p.product_id))]
  const products = await fetchAllPages<{ id: string; user_id: string }>((from, to) =>
    supabaseAdmin.from("products").select("id, user_id").in("id", productIds).range(from, to)
  )
  const userIdByProduct = new Map(products.map((p) => [p.id, p.user_id]))

  const userIds = [...new Set(products.map((p) => p.user_id))]
  const profiles = await fetchAllPages<{ id: string; tier: string; active_trial: boolean }>((from, to) =>
    supabaseAdmin.from("profiles").select("id, tier, active_trial").in("id", userIds).range(from, to)
  )
  const eligibleByUser = new Map(profiles.map((p) => [p.id, p.tier !== "free" || p.active_trial]))

  const candidateProspects = newProspects.filter((p) => {
    const userId = userIdByProduct.get(p.product_id)
    return userId !== undefined && eligibleByUser.get(userId) === true
  })

  log.info("owner-eligibility filter done", {
    statusNew: newProspects.length,
    ownerEligible: candidateProspects.length,
    skippedExpiredOwner: newProspects.length - candidateProspects.length,
  })

  if (!candidateProspects.length) {
    log.info("no owner-eligible status=new prospects to rebalance")
    return
  }

  // Only prospects where all 3 steps are still untouched are safe to move.
  const safeProspectIds: string[] = []
  for (const idBatch of chunk(
    candidateProspects.map((p) => p.id),
    CHUNK_SIZE
  )) {
    const { data: sequences, error: seqError } = await supabaseAdmin
      .from("prospect_sequences")
      .select("prospect_id, status")
      .in("prospect_id", idBatch)

    if (seqError) throw new Error(`failed to load sequences for batch: ${seqError.message}`)

    const byProspect = new Map<string, string[]>()
    for (const row of sequences ?? []) {
      const list = byProspect.get(row.prospect_id) ?? []
      list.push(row.status)
      byProspect.set(row.prospect_id, list)
    }

    for (const id of idBatch) {
      const statuses = byProspect.get(id) ?? []
      if (statuses.length === 3 && statuses.every((s) => s === "pending")) {
        safeProspectIds.push(id)
      }
    }
  }

  log.info("safety filter done", {
    candidates: candidateProspects.length,
    safeToMove: safeProspectIds.length,
    skippedInFlight: candidateProspects.length - safeProspectIds.length,
  })

  if (!safeProspectIds.length) {
    log.info("nothing safe to rebalance")
    return
  }

  const currentAssignment = new Map(candidateProspects.map((p) => [p.id, p.email_account_id]))
  const moves = new Map<string, string[]>() // targetAccountId -> prospectIds

  for (const prospectId of safeProspectIds) {
    const from = currentAssignment.get(prospectId)
    const sorted = [...runningTotals.entries()].sort((a, b) => a[1] - b[1])
    const leastLoadedId = sorted[0]?.[0]
    if (!leastLoadedId || leastLoadedId === from) {
      // Already on the least-loaded account (or a near tie resolving back to
      // it) — still bump its counter so the next candidate sees it as busier.
      if (leastLoadedId) runningTotals.set(leastLoadedId, (runningTotals.get(leastLoadedId) ?? 0) + 1)
      continue
    }

    runningTotals.set(leastLoadedId, (runningTotals.get(leastLoadedId) ?? 0) + 1)
    if (from) runningTotals.set(from, Math.max(0, (runningTotals.get(from) ?? 1) - 1))

    const list = moves.get(leastLoadedId) ?? []
    list.push(prospectId)
    moves.set(leastLoadedId, list)
  }

  const moveSummary = [...moves.entries()].map(([accountId, ids]) => ({
    to: publicAccounts.find((a) => a.id === accountId)?.name,
    count: ids.length,
  }))
  log.info(dryRun ? "dry-run: planned moves" : "planned moves", { moveSummary })

  if (dryRun) {
    log.success("dry-run done", { totalMoves: [...moves.values()].reduce((sum, ids) => sum + ids.length, 0) })
    return
  }

  let moved = 0
  for (const [targetAccountId, prospectIds] of moves.entries()) {
    for (const idBatch of chunk(prospectIds, CHUNK_SIZE)) {
      const { error: seqUpdateError } = await supabaseAdmin
        .from("prospect_sequences")
        .update({ email_account_id: targetAccountId })
        .in("prospect_id", idBatch)

      if (seqUpdateError) {
        log.warn("failed to update sequences for batch", { targetAccountId, error: seqUpdateError.message })
        continue
      }

      const { error: prospectUpdateError } = await supabaseAdmin
        .from("backlink_prospects")
        .update({ email_account_id: targetAccountId })
        .in("id", idBatch)

      if (prospectUpdateError) {
        log.warn("failed to update prospects for batch", { targetAccountId, error: prospectUpdateError.message })
        continue
      }

      moved += idBatch.length
    }
  }

  log.success("backfill done", { moved, skippedInFlight: candidateProspects.length - safeProspectIds.length })
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    log.error("backfill script failed", { error: String(err) })
    process.exit(1)
  })
