import { Router, type IRouter } from "express"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendFeedbackSequenceEmail } from "../helpers/emails/feedback-sequence.js"
import { classifyFunnelStage, getUserFiredEvents } from "../helpers/posthog-query.js"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("route-dev-send-onboarding-email")

export const devSendOnboardingEmailRouter: IRouter = Router()

devSendOnboardingEmailRouter.post("/dev-send-onboarding-email", async (req, res) => {
  const { userId, step = 0 } = req.body as { userId?: string; step?: number }

  if (!userId) {
    log.warn("missing userId")
    res.status(400).json({ error: "userId required" })
    return
  }

  if (step < 0 || step > 2) {
    log.warn("invalid step", { step })
    res.status(400).json({ error: "step must be 0, 1, or 2" })
    return
  }

  log.info("starting", { userId, step })

  try {
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single()

    if (profileError || !profile?.email) {
      log.warn("no profile found", { userId })
      res.status(404).json({ error: "profile not found" })
      return
    }

    const events = await getUserFiredEvents(userId)
    const stage = classifyFunnelStage(events)

    await sendFeedbackSequenceEmail({
      to: profile.email,
      userId,
      userName: profile.name,
      replyToken: "dev-test-token",
      step,
      stage,
    })

    log.info("done", { userId, step, stage })
    res.json({ ok: true, step, stage, to: profile.email })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("failed", { userId, step, error: msg })
    res.status(502).json({ error: msg })
  }
})
