import { notFound, redirect } from "next/navigation"

import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { EmailAccountDetailClient } from "@/components/email-accounts/email-account-detail-client"
import type { EmailAccount } from "@/app/dashboard/email-accounts/_data"

export default async function EmailAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) redirect("/signin")

  const { data: row } = await supabaseAdmin
    .from("email_accounts")
    .select(
      "id, email, name, provider, status, daily_send_cap, created_at, error_message, smtp_host, smtp_port, imap_host, imap_port"
    )
    .eq("id", id)
    .eq("user_id", user.id)
    .eq("is_public", false)
    .maybeSingle()

  if (!row) notFound()

  const account: EmailAccount = {
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

  return <EmailAccountDetailClient account={account} />
}
