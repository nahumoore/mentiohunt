import { supabaseAdmin } from "@workspace/supabase/admin"
import { createHmac, timingSafeEqual } from "node:crypto"
import { Router, type IRouter, type Request } from "express"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("resend-inbound-webhook")

export const resendInboundWebhookRouter: IRouter = Router()

function verifySvixSignature(
  rawBody: string,
  svixId: string,
  svixTimestamp: string,
  svixSignature: string,
  secret: string
): boolean {
  // Svix signs: "{svix-id}.{svix-timestamp}.{body}"
  const signedContent = `${svixId}.${svixTimestamp}.${rawBody}`
  // Secret is base64-encoded after stripping "whsec_" prefix
  const keyBase64 = secret.startsWith("whsec_") ? secret.slice(6) : secret
  const key = Buffer.from(keyBase64, "base64")
  const computed = createHmac("sha256", key).update(signedContent).digest("base64")

  // svix-signature may contain multiple space-separated "v1,<base64>" values
  const signatures = svixSignature.split(" ")
  return signatures.some((sig) => {
    const b64 = sig.startsWith("v1,") ? sig.slice(3) : sig
    try {
      return timingSafeEqual(Buffer.from(computed), Buffer.from(b64))
    } catch {
      return false
    }
  })
}

function extractReplyToken(address: string): string | null {
  // Matches reply-{uuid}@xaipreno.resend.app
  const match = address.match(/reply-([0-9a-f-]{36})@/i)
  return match?.[1] ?? null
}

function parseToAddresses(body: Record<string, unknown>): string[] {
  // Resend sends `to` as a string or array, at top level or nested under `data`
  const data = (body.data as Record<string, unknown> | undefined) ?? body
  const raw = data.to
  if (!raw) return []
  if (Array.isArray(raw)) return raw.map(String)
  return [String(raw)]
}

resendInboundWebhookRouter.post("/webhooks/resend-inbound", async (req, res) => {
  const secret = process.env.RESEND_SECRET_TOKEN
  if (!secret) {
    log.warn("RESEND_SECRET_TOKEN not configured")
    res.status(500).json({ error: "webhook secret not configured" })
    return
  }

  const rawBody = (req as Request & { rawBody?: string }).rawBody ?? ""
  const svixId = req.headers["svix-id"]
  const svixTimestamp = req.headers["svix-timestamp"]
  const svixSignature = req.headers["svix-signature"]

  if (!svixId || !svixTimestamp || !svixSignature) {
    log.warn("missing svix headers")
    res.status(400).json({ error: "missing webhook headers" })
    return
  }

  const valid = verifySvixSignature(
    rawBody,
    String(svixId),
    String(svixTimestamp),
    String(svixSignature),
    secret
  )

  if (!valid) {
    log.warn("webhook signature verification failed")
    res.status(400).json({ error: "invalid signature" })
    return
  }

  const body = req.body as Record<string, unknown>

  const addresses = parseToAddresses(body)
  const token = addresses.flatMap((a) => extractReplyToken(a) ?? []).at(0)

  if (!token) {
    log.info("no reply token found in inbound email", { to: addresses })
    res.status(200).json({ ok: true })
    return
  }

  const { error } = await supabaseAdmin
    .from("email_sequences")
    .update({ status: "stopped", stopped_at: new Date().toISOString() })
    .eq("reply_token", token)
    .eq("status", "active")

  if (error) {
    log.error("failed to stop sequence", { token, error: error.message })
    res.status(500).json({ error: "failed to stop sequence" })
    return
  }

  log.info("sequence stopped via reply", { token })
  res.status(200).json({ ok: true })
})
