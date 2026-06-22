import { Router, type IRouter } from "express"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendFeedbackSequenceEmail } from "../email-sequences/feedback-sequence.js"
import type { FunnelStage } from "../email-sequences/feedback-sequence.js"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("route-dev-send-onboarding-email")

export const devSendOnboardingEmailRouter: IRouter = Router()

devSendOnboardingEmailRouter.post("/dev-send-onboarding-email", async (req, res) => {
  const { userId } = req.body as { userId?: string }

  if (!userId) {
    log.warn("missing userId")
    res.status(400).json({ error: "userId required" })
    return
  }

  log.info("starting", { userId })

  try {
    const [{ data: profile, error: profileError }, { data: sequence, error: sequenceError }] =
      await Promise.all([
        supabaseAdmin.from("profiles").select("email, name").eq("id", userId).single(),
        supabaseAdmin
          .from("email_sequences")
          .select("step, reply_token")
          .eq("user_id", userId)
          .eq("type", "onboarding")
          .eq("status", "active")
          .single(),
      ])

    if (profileError || !profile?.email) {
      log.warn("no profile found", { userId })
      res.status(404).json({ error: "profile not found" })
      return
    }

    if (sequenceError || !sequence) {
      log.warn("no active sequence found", { userId })
      res.status(404).json({ error: "no active onboarding sequence for this user" })
      return
    }

    const stage: FunnelStage = "used_both"

    await sendFeedbackSequenceEmail({
      to: profile.email,
      userId,
      userName: profile.name,
      replyToken: sequence.reply_token,
      step: sequence.step,
      stage,
    })

    log.info("done", { userId, step: sequence.step, stage })
    res.json({ ok: true, step: sequence.step, stage, to: profile.email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("failed", { userId, error: msg })
    res.status(502).json({ error: msg })
  }
})
