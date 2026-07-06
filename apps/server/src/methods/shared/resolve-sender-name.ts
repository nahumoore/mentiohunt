import { supabaseAdmin } from "@workspace/supabase/admin"

export type ResolvedSender = { name: string | null; isPublicAccount: boolean }

/**
 * Outreach is always signed and sent as the customer, never as Mentiohunt or the
 * shared mailbox's own identity — only the underlying sending infra (shared pool
 * today, a connected mailbox in the future) differs by tier.
 */
export async function resolveSenderName(userId: string): Promise<ResolvedSender> {
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

    if (userAccount) return { name: profile?.name ?? null, isPublicAccount: false }
  }

  return { name: profile?.name ?? null, isPublicAccount: true }
}
