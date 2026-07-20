import { Router, type IRouter } from "express"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import {
  sendBillingNotificationEmail,
  type BillingNotificationType,
  type BillingTier,
} from "../helpers/emails/send-billing-notification-email.js"

const log = createLogger("route-dev-send-billing-notification-email")

export const devSendBillingNotificationEmailRouter: IRouter = Router()

const NOTIFICATION_TYPES: readonly BillingNotificationType[] = [
  "subscription_created",
  "subscription_updated",
  "subscription_deleted",
  "payment_failed",
]

const TIERS: readonly BillingTier[] = ["free", "pro", "agency"]

devSendBillingNotificationEmailRouter.post(
  "/dev-send-billing-notification-email",
  async (req, res) => {
    const { userId, type, tier } = req.body as {
      userId?: string
      type?: BillingNotificationType
      tier?: BillingTier
    }

    if (!userId || !type || !NOTIFICATION_TYPES.includes(type)) {
      res.status(400).json({
        error: `userId and type required, type must be one of: ${NOTIFICATION_TYPES.join(", ")}`,
      })
      return
    }

    if (tier && !TIERS.includes(tier)) {
      res.status(400).json({ error: `tier must be one of: ${TIERS.join(", ")}` })
      return
    }

    log.info("starting", { userId, type, tier })

    try {
      const { data: profile, error } = await supabaseAdmin
        .from("profiles")
        .select("email, name")
        .eq("id", userId)
        .maybeSingle()

      if (error || !profile?.email) {
        log.warn("no profile found", { userId })
        res.status(404).json({ error: "profile not found" })
        return
      }

      await sendBillingNotificationEmail({
        to: profile.email,
        name: profile.name,
        type,
        tier: tier ?? null,
      })

      log.info("done", { userId, type, to: profile.email })
      res.json({ ok: true, type, to: profile.email })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { userId, type, error: msg })
      res.status(502).json({ error: msg })
    }
  }
)
