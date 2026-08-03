import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Tables } from "@workspace/supabase/database-types"
import { redirect } from "next/navigation"

import { EmailAccountsClient } from "@/components/email-accounts/email-accounts-client"
import type { UserPlan } from "@/components/email-accounts/email-accounts-client"
import type { EmailAccount } from "@/app/dashboard/email-accounts/_data"

type EmailAccountRow = Pick<
  Tables<"email_accounts">,
  | "id"
  | "email"
  | "name"
  | "provider"
  | "status"
  | "daily_send_cap"
  | "created_at"
  | "error_message"
  | "smtp_host"
  | "smtp_port"
  | "imap_host"
  | "imap_port"
>

function mapRow(row: EmailAccountRow): EmailAccount {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    provider: row.provider,
    status: row.status,
    dailySendCap: row.daily_send_cap,
    connectedAt: row.created_at.slice(0, 10),
    errorMessage: row.error_message ?? undefined,
    smtpHost: row.smtp_host ?? undefined,
    smtpPort: row.smtp_port ?? undefined,
    imapHost: row.imap_host ?? undefined,
    imapPort: row.imap_port ?? undefined,
  }
}

export default async function EmailAccountsPage() {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/signin")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("tier, send_outreach_from_private_inbox")
    .eq("id", user.id)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  const userPlan: UserPlan = isPaid ? "active" : "free_trial"

  let accounts: EmailAccount[] = []

  if (isPaid) {
    const { data: rows, error } = await supabaseAdmin
      .from("email_accounts")
      .select(
        "id, email, name, provider, status, daily_send_cap, created_at, error_message, smtp_host, smtp_port, imap_host, imap_port"
      )
      .eq("user_id", user.id)
      .eq("is_public", false)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Failed to fetch email accounts:", error)
    } else {
      accounts = (rows ?? []).map(mapRow)
    }
  }

  return (
    <EmailAccountsClient
      userPlan={userPlan}
      accounts={accounts}
      sendFromPrivateInbox={profile?.send_outreach_from_private_inbox ?? false}
    />
  )
}
