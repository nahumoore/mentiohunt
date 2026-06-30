import { supabaseAdmin } from "@workspace/supabase/admin"

export async function resolveEmailAccount(
  userId: string
): Promise<{ id: string; name: string | null } | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid) {
    const { data: userAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("id, name")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .single()

    if (userAccount) return { id: userAccount.id, name: userAccount.name ?? null }
  }

  const { data: publicAccount } = await supabaseAdmin
    .from("email_accounts")
    .select("id, name")
    .eq("is_public", true)
    .single()

  return publicAccount ? { id: publicAccount.id, name: publicAccount.name ?? null } : null
}
