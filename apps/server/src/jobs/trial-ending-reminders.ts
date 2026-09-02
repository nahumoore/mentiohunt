import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendTrialEndingReminder } from "../helpers/emails/send-trial-ending-reminder.js"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("trial-ending-reminders")

export async function sendTrialEndingReminders(): Promise<void> {
  const now = new Date()
  const cutoff = new Date(now.getTime() + 48 * 60 * 60 * 1000)
  const { data: profiles, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, billing_period_end_at")
    .eq("active_trial", true)
    .eq("onboarding_completed", true)
    .is("trial_ending_reminder_sent_at", null)
    .gt("billing_period_end_at", now.toISOString())
    .lte("billing_period_end_at", cutoff.toISOString())

  if (error) {
    log.error("failed to load ending trials", { error: error.message })
    return
  }

  for (const profile of profiles ?? []) {
    if (!profile.billing_period_end_at) continue
    const sent = await sendTrialEndingReminder({
      to: profile.email,
      userName: profile.name,
      trialEnd: new Date(profile.billing_period_end_at).toLocaleDateString(
        "en-US",
        {
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }
      ),
      userId: profile.id,
    })
    if (sent) {
      await supabaseAdmin
        .from("profiles")
        .update({ trial_ending_reminder_sent_at: new Date().toISOString() })
        .eq("id", profile.id)
        .is("trial_ending_reminder_sent_at", null)
    }
  }
}
