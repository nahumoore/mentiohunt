import type { Metadata } from "next"

import { assertDevOnlyPage } from "@/lib/support-chat/admin-guard"
import { supabaseAdmin } from "@workspace/supabase/admin"

import { SupportConsole } from "./support-console"

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

// Dev-only console for reading and replying to support chat conversations.
// 404s outside `pnpm dev` — see lib/support-chat/admin-guard.ts. There is no
// production access model here on purpose: the founder runs this locally,
// against the same remote Supabase project real users hit.
export default async function SupportPage() {
  assertDevOnlyPage()

  const { data: conversations } = await supabaseAdmin
    .from("support_conversations")
    .select("*")
    .eq("status", "open")
    .order("last_message_at", { ascending: false, nullsFirst: false })

  return <SupportConsole initialConversations={conversations ?? []} />
}
