import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendMediaMentionsDigestEmail } from "../helpers/emails/email.js"
import { createLogger } from "../helpers/logger.js"
import { discoverMediaMentions } from "../methods/media-mentions/discover-media-mentions.js"

const log = createLogger("job-discover-media-mentions")

export async function runDiscoverMediaMentions(): Promise<void> {
  log.info("job started")
  try {
    const { inserted, bySource } = await discoverMediaMentions()
    log.info("job finished")

    if (inserted === 0) return

    const { data: users, error } = await supabaseAdmin
      .from("profiles")
      .select("id, email, name")
      .eq("active_trial", true)

    if (error || !users || users.length === 0) {
      log.warn("could not load active users for digest", { error: error?.message })
      return
    }

    log.info("sending media mentions digest", { inserted, users: users.length })

    await Promise.allSettled(
      users
        .filter((u) => u.email)
        .map((u) =>
          sendMediaMentionsDigestEmail({
            to: u.email!,
            userId: u.id,
            inserted,
            bySource,
          })
        )
    )
  } catch (err) {
    log.error("job failed", { error: String(err) })
  }
}
