import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Database } from "@workspace/supabase/database-types"
import { createLogger } from "../logger.js"

const log = createLogger("notifications")

type NotificationType = Database["public"]["Enums"]["notification_type"]

type CreateNotificationInput = {
  userId: string
  type: NotificationType
  title: string
  body?: string | null
  linkHref?: string | null
  prospectId?: string | null
  trackedLinkId?: string | null
}

// Best-effort: a failed insert here should never take down the caller's main
// flow (reply matching, digest send) — worst case the user misses a bell
// notification but still gets the email alert.
export async function createNotification(input: CreateNotificationInput): Promise<void> {
  const { error } = await supabaseAdmin.from("notifications").insert({
    user_id: input.userId,
    type: input.type,
    title: input.title,
    body: input.body ?? null,
    link_href: input.linkHref ?? null,
    prospect_id: input.prospectId ?? null,
    tracked_link_id: input.trackedLinkId ?? null,
  })

  if (error) {
    log.warn("failed to create notification", { userId: input.userId, type: input.type, error: error.message })
  }
}
