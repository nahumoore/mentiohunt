import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendFeedbackSequenceEmail } from "../email-sequences/feedback-sequence.js"
import type { FunnelStage } from "../email-sequences/feedback-sequence.js"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("feedback-email-sequence")

const STEP_DELAYS_MS = [
  48 * 60 * 60 * 1000,  // after step 0: wait 48h for step 1
  96 * 60 * 60 * 1000,  // after step 1: wait 96h for step 2
]

const MIN_PROFILE_AGE_MS = 2 * 60 * 60 * 1000 // never send within 2h of signup

export async function runFeedbackEmailSequence() {
  log.info("scheduler tick")

  const { data: sequences, error } = await supabaseAdmin
    .from("email_sequences")
    .select("id, user_id, reply_token, step")
    .eq("status", "active")
    .eq("type", "onboarding")
    .lte("next_send_at", new Date().toISOString())

  if (error) {
    log.error("failed to load sequences", { error: error.message })
    return
  }

  if (!sequences || sequences.length === 0) {
    log.info("no sequences due")
    return
  }

  log.info("sequences due", { count: sequences.length })

  for (const seq of sequences) {
    try {
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("email, name, created_at")
        .eq("id", seq.user_id)
        .single()

      if (profileError || !profile?.email) {
        log.warn("no profile for sequence", { sequenceId: seq.id, userId: seq.user_id })
        continue
      }

      const profileAgeMs = Date.now() - new Date(profile.created_at).getTime()
      if (profileAgeMs < MIN_PROFILE_AGE_MS) {
        log.info("skipping — profile too new", { sequenceId: seq.id, userId: seq.user_id, profileAgeMs })
        continue
      }

      const stage: FunnelStage = "used_both"

      await sendFeedbackSequenceEmail({
        to: profile.email,
        userId: seq.user_id,
        userName: profile.name,
        replyToken: seq.reply_token,
        step: seq.step,
        stage,
      })

      const isLastStep = seq.step >= 2
      if (isLastStep) {
        await supabaseAdmin
          .from("email_sequences")
          .update({ status: "completed" })
          .eq("id", seq.id)
      } else {
        const delayMs = STEP_DELAYS_MS[seq.step] ?? 48 * 60 * 60 * 1000
        const nextSendAt = new Date(Date.now() + delayMs).toISOString()
        await supabaseAdmin
          .from("email_sequences")
          .update({ step: seq.step + 1, next_send_at: nextSendAt })
          .eq("id", seq.id)
      }

      log.info("sequence step processed", {
        sequenceId: seq.id,
        userId: seq.user_id,
        step: seq.step,
        stage,
        completed: isLastStep,
      })
    } catch (err) {
      log.error("error processing sequence", {
        sequenceId: seq.id,
        error: String(err),
      })
    }
  }
}
