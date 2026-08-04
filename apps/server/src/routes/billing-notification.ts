import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"
import {
  sendBillingNotificationEmail,
  type BillingNotificationType,
  type BillingTier,
} from "../helpers/emails/send-billing-notification-email.js"
import { resumeSequencesForUsers } from "../helpers/outreach/trial-sequences.js"

const log = createLogger("route-billing-notification")

export const billingNotificationRouter: IRouter = Router()

const NOTIFICATION_TYPES: readonly BillingNotificationType[] = [
  "subscription_created",
  "subscription_updated",
  "subscription_deleted",
  "payment_failed",
]

const TIERS: readonly BillingTier[] = ["free", "pro", "agency"]

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function readBodyString(body: unknown, key: string): string {
  if (body === null || typeof body !== "object") return ""
  const value = (body as Record<string, unknown>)[key]
  return typeof value === "string" ? value.trim() : ""
}

billingNotificationRouter.post("/billing/notification", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const type = readBodyString(req.body, "type") as BillingNotificationType
  const rawTier = readBodyString(req.body, "tier")
  const tier = (rawTier || null) as BillingTier | null

  if (!userId || !NOTIFICATION_TYPES.includes(type)) {
    res.status(400).json({ error: "userId and a valid type are required" })
    return
  }

  if (tier && !TIERS.includes(tier)) {
    res.status(400).json({ error: "invalid tier" })
    return
  }

  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("email, name")
    .eq("id", userId)
    .maybeSingle()

  if (error || !profile?.email) {
    log.warn("no profile found for billing notification", { userId, type })
    res.status(404).json({ error: "profile not found" })
    return
  }

  try {
    if ((type === "subscription_created" || type === "subscription_updated") && (tier === "pro" || tier === "agency")) {
      await resumeSequencesForUsers([userId])
    }

    await sendBillingNotificationEmail({
      to: profile.email,
      name: profile.name,
      type,
      tier,
    })

    log.info("sent billing notification", { userId, type, tier })
    res.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("failed to send billing notification", { userId, type, error: msg })
    res.status(502).json({ error: msg })
  }
})
