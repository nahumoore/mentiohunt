import { supabaseAdmin } from "@workspace/supabase/admin"

export async function resolveSenderName(userId: string): Promise<string | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid) {
    const { data: userAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("name")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .single()

    if (userAccount) return userAccount.name ?? null
  }

  const { data: publicAccount } = await supabaseAdmin
    .from("email_accounts")
    .select("name")
    .eq("is_public", true)
    .single()

  return publicAccount?.name ?? null
}
