import { supabaseAdmin } from "@workspace/supabase/admin"

export type ResolvedEmailAccount = { id: string; name: string | null; isPublic: boolean }

type CandidateAccount = { id: string; daily_send_cap: number }

function utcDayStart(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString()
}

/**
 * Picks the least-loaded account (by today's sent count vs. its daily cap)
 * from a set of candidates. Falls back to the first candidate if every
 * account is at or over its cap, so sending never stalls outright.
 */
async function pickLeastLoadedAccount(candidates: CandidateAccount[]): Promise<string | null> {
  const firstCandidate = candidates[0]
  if (!firstCandidate) return null

  const accountIds = candidates.map((account) => account.id)
  const { data: sentToday } = await supabaseAdmin
    .from("prospect_sequences")
    .select("email_account_id")
    .in("email_account_id", accountIds)
    .eq("status", "sent")
    .gte("sent_at", utcDayStart())

  const sentCountByAccount = new Map<string, number>()
  for (const row of sentToday ?? []) {
    sentCountByAccount.set(row.email_account_id, (sentCountByAccount.get(row.email_account_id) ?? 0) + 1)
  }

  // Tie-break by total prospects ever assigned to the account (not just today's
  // sends) — ties on sentToday are the common case, since throughput is low
  // enough that most accounts sit at 0 sent-today most of the day. Breaking
  // ties by array order instead of load left newly added accounts starved,
  // since they'd always lose the tie to whichever account came back first.
  const { data: totalAssigned } = await supabaseAdmin
    .from("prospect_sequences")
    .select("email_account_id")
    .in("email_account_id", accountIds)
    .eq("step", 1)

  const totalCountByAccount = new Map<string, number>()
  for (const row of totalAssigned ?? []) {
    totalCountByAccount.set(row.email_account_id, (totalCountByAccount.get(row.email_account_id) ?? 0) + 1)
  }

  const selected = [...candidates]
    .map((account) => ({
      ...account,
      sentToday: sentCountByAccount.get(account.id) ?? 0,
      totalAssigned: totalCountByAccount.get(account.id) ?? 0,
    }))
    .filter((account) => account.sentToday < account.daily_send_cap)
    .sort((a, b) => a.sentToday - b.sentToday || a.totalAssigned - b.totalAssigned)[0]

  return (selected ?? firstCandidate).id
}

async function resolvePublicPoolAccount(profileName: string | null): Promise<ResolvedEmailAccount | null> {
  const { data: publicAccounts } = await supabaseAdmin
    .from("email_accounts")
    .select("id, daily_send_cap")
    .eq("is_public", true)
    .eq("status", "active")

  if (!publicAccounts?.length) return null

  const selectedId = await pickLeastLoadedAccount(publicAccounts)
  return selectedId ? { id: selectedId, name: profileName, isPublic: true } : null
}

/**
 * Resolves which email_accounts row a prospect's sequence sends through
 * (shared pool vs. one of the customer's own connected mailboxes), plus the
 * name to sign emails with — always the customer's own name, never the
 * account's.
 *
 * Defaults to the shared pool. A paid user's connected mailbox is only used
 * for automated outreach if that specific account has opted in via
 * email_accounts.send_automated_outreach — this is per mailbox, not
 * per-user, so someone with several connected inboxes can automate through
 * some and keep others reserved purely for replying personally once a
 * prospect responds.
 */
export async function resolveEmailAccount(
  userId: string
): Promise<ResolvedEmailAccount | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, name")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid) {
    const { data: optedInAccounts } = await supabaseAdmin
      .from("email_accounts")
      .select("id, daily_send_cap")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .eq("send_automated_outreach", true)

    if (optedInAccounts?.length) {
      const selectedId = await pickLeastLoadedAccount(optedInAccounts)
      if (selectedId) return { id: selectedId, name: profile?.name ?? null, isPublic: false }
    }
  }

  return resolvePublicPoolAccount(profile?.name ?? null)
}
