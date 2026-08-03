import { supabaseAdmin } from "@workspace/supabase/admin"

export type ResolvedEmailAccount = { id: string; name: string | null; isPublic: boolean }

function utcDayStart(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toISOString()
}

async function resolvePublicPoolAccount(profileName: string | null): Promise<ResolvedEmailAccount | null> {
  const { data: publicAccounts } = await supabaseAdmin
    .from("email_accounts")
    .select("id, daily_send_cap")
    .eq("is_public", true)
    .eq("status", "active")

  if (!publicAccounts?.length) return null

  const accountIds = publicAccounts.map((account) => account.id)
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

  const selected = [...publicAccounts]
    .map((account) => ({
      ...account,
      sentToday: sentCountByAccount.get(account.id) ?? 0,
    }))
    .filter((account) => account.sentToday < account.daily_send_cap)
    .sort((a, b) => a.sentToday - b.sentToday || a.daily_send_cap - b.daily_send_cap)[0]

  const fallback = selected ?? publicAccounts[0]
  return fallback ? { id: fallback.id, name: profileName, isPublic: true } : null
}

/**
 * Resolves which email_accounts row a prospect's sequence sends through
 * (shared pool vs. the customer's own connected mailbox), plus the name to
 * sign emails with — always the customer's own name, never the account's.
 *
 * Defaults to the shared pool. Paid users only send automated outreach from
 * their own connected mailbox if they've explicitly opted in via
 * profiles.send_outreach_from_private_inbox — otherwise their mailbox stays
 * reserved for replying personally once a prospect responds.
 */
export async function resolveEmailAccount(
  userId: string
): Promise<ResolvedEmailAccount | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, name, send_outreach_from_private_inbox")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid && profile?.send_outreach_from_private_inbox) {
    const { data: userAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .single()

    if (userAccount) return { id: userAccount.id, name: profile?.name ?? null, isPublic: false }
  }

  return resolvePublicPoolAccount(profile?.name ?? null)
}
