import { supabaseAdmin } from "@workspace/supabase/admin"

/**
 * Resolves which email_accounts row a prospect's sequence sends through
 * (shared pool vs. the customer's own connected mailbox), plus the name to
 * sign emails with — always the customer's own name, never the account's.
 */
export async function resolveEmailAccount(
  userId: string
): Promise<{ id: string; name: string | null } | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier, name")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid) {
    const { data: userAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .single()

    if (userAccount) return { id: userAccount.id, name: profile?.name ?? null }
  }

  const { data: publicAccount } = await supabaseAdmin
    .from("email_accounts")
    .select("id")
    .eq("is_public", true)
    .single()

  return publicAccount ? { id: publicAccount.id, name: profile?.name ?? null } : null
}
