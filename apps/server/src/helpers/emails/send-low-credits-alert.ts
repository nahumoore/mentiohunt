import { ALERTS_FROM, PRIMARY_EMAIL } from "@workspace/supabase/email-settings"
import { createLogger } from "../logger.js"
import { getResend } from "./base.js"

const log = createLogger("send-low-credits-alert")

/**
 * Internal ops alert, not a customer email — plain text straight to the
 * founder's inbox, no branded template/unsubscribe machinery. Fired when
 * OpenRouter rejects every model in a call with "insufficient credits",
 * which otherwise fails silently (see helpers/llm-retry.ts) and reads to
 * customers as "no opportunities found" instead of "billing broke".
 */
export async function sendLowCreditsAlertEmail(details: string) {
  try {
    const resend = getResend()
    await resend.emails.send({
      from: ALERTS_FROM,
      to: PRIMARY_EMAIL,
      subject: "OpenRouter out of credits — discovery scoring is failing silently",
      text: `Every model call is failing with "Insufficient credits" as of now.

While the balance is out, every discovery run's LLM scoring/matching step fails and gets reported as "0 qualified" — this looks identical to a genuinely bad niche/no-match run unless someone checks the logs.

Top up: https://openrouter.ai/settings/credits

Latest error:
${details}`,
    })
    log.info("low credits alert sent")
  } catch (err) {
    log.error("failed to send low credits alert", { error: String(err) })
  }
}
