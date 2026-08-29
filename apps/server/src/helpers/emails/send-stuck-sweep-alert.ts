import { ALERTS_FROM, PRIMARY_EMAIL } from "@workspace/supabase/email-settings"
import { createLogger } from "../logger.js"
import { getResend } from "./base.js"

const log = createLogger("send-stuck-sweep-alert")

/**
 * Internal ops alert, not a customer email. Fired when the stuck
 * user-submitted-prospect sweep (jobs/prospect-outreach-monitor.ts) exhausts
 * its retries — that sweep is the only thing that un-sticks a submitted URL
 * left at enrichment_status='enriching' after a crash/deploy, so a silent,
 * persistent failure here means affected users are stuck on a permanent
 * spinner with nothing surfacing it.
 */
export async function sendStuckSweepAlertEmail(details: string) {
  try {
    const resend = getResend()
    await resend.emails.send({
      from: ALERTS_FROM,
      to: PRIMARY_EMAIL,
      subject: "Stuck-prospect sweep is failing — submitted URLs may be stuck spinning",
      text: `The stuck user-submitted-prospect sweep has failed on every retry as of now.

While this keeps failing, any user whose submitted-URL enrichment crashed mid-run stays stuck at "enriching" forever instead of being flagged as failed — they see a permanent spinner with no recovery.

Latest error:
${details}`,
    })
    log.info("stuck sweep alert sent")
  } catch (err) {
    log.error("failed to send stuck sweep alert", { error: String(err) })
  }
}
