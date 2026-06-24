import { notFound } from "next/navigation"

import { EmailAccountDetailClient } from "@/components/email-accounts/email-account-detail-client"
import { SEED_ACCOUNTS } from "@/app/dashboard/email-accounts/_data"

export default async function EmailAccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const account = SEED_ACCOUNTS.find((a) => a.id === id)

  if (!account) notFound()

  return <EmailAccountDetailClient account={account} />
}
