import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import { pauseSequencesForUsers } from "../helpers/outreach/trial-sequences.js"

const log = createLogger("deactivate-expired-free-trials")

export async function deactivateExpiredFreeTrials(): Promise<void> {
  const now = new Date().toISOString()

  log.info("checking for expired free trials", { now })

  const { data: expiredProfiles, error } = await supabaseAdmin
    .from("profiles")
    .update({ active_trial: false })
    .eq("tier", "free")
    .eq("active_trial", true)
    .lt("billing_period_end_at", now)
    .select("id")

  if (error) {
    log.error("failed to deactivate expired free trials", { error: error.message })
    return
  }

  log.info("expired free trial check complete", {
    deactivated: expiredProfiles?.length ?? 0,
  })

  if (expiredProfiles?.length) {
    await pauseSequencesForUsers(expiredProfiles.map((p) => p.id))
  }
}
