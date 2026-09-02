import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { captureServerEvent } from "../helpers/analytics.js"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { activatePreviewProspects } from "../processes/onboarding/activate-preview-prospects.js"
import { runOnboardingJobs } from "../processes/onboarding/run-onboarding-jobs.js"

const log = createLogger("route-onboarding-complete")

export const onboardingCompleteRouter: IRouter = Router()

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

onboardingCompleteRouter.post("/onboarding/complete", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const productId = readBodyString(req.body, "productId")

  if (!userId || !productId) {
    res.status(400).json({ error: "userId and productId are required" })
    return
  }

  const body =
    req.body !== null && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {}
  const rawCrawlLimit = Number(body["crawlLimit"] ?? body["pageLimit"])
  const crawlLimit =
    Number.isFinite(rawCrawlLimit) && rawCrawlLimit > 0 ? rawCrawlLimit : 50
  const autoDiscoverPages = body["autoDiscoverPages"] !== false
  const activatePreview = body["activatePreview"] === true

  res.status(202).json({ queued: true })

  withRouteLog(`onboarding-complete-${productId}`, () =>
    activatePreview
      ? activatePreviewProspects(userId, productId)
      : runOnboardingJobs(userId, productId, crawlLimit, autoDiscoverPages)
  ).catch((err) =>
    log.error("unhandled onboarding jobs error", { error: String(err) })
  )
})

onboardingCompleteRouter.post("/onboarding/preview", async (req, res) => {
  const requestedAt = Date.now()
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const productId = readBodyString(req.body, "productId")
  const previewId = readBodyString(req.body, "previewId")
  if (!userId || !productId || !previewId) {
    res
      .status(400)
      .json({ error: "userId, productId, and previewId are required" })
    return
  }

  const body =
    req.body !== null && typeof req.body === "object"
      ? (req.body as Record<string, unknown>)
      : {}
  const rawCrawlLimit = Number(body["crawlLimit"] ?? body["pageLimit"])
  const crawlLimit =
    Number.isFinite(rawCrawlLimit) && rawCrawlLimit > 0
      ? Math.min(rawCrawlLimit, 50)
      : 50
  const autoDiscoverPages = body["autoDiscoverPages"] !== false

  res.status(202).json({ queued: true, previewId })

  void captureServerEvent("onboarding_preview_requested", userId, {
    preview_id: previewId,
    product_id: productId,
  })

  withRouteLog(`onboarding-preview-${previewId}`, () =>
    runOnboardingJobs(userId, productId, crawlLimit, autoDiscoverPages, {
      mode: "preview",
      previewId,
    })
  ).catch(async (err) => {
    log.error("unhandled onboarding preview error", {
      previewId,
      error: String(err),
    })
    void captureServerEvent("onboarding_preview_failed", userId, {
      preview_id: previewId,
      product_id: productId,
      reason: err instanceof Error ? err.name : "unknown",
      duration_ms: Date.now() - requestedAt,
      cost_usd: 0,
    })
    await supabaseAdmin
      .from("onboarding_previews")
      .update({
        status: "failed",
        failure_reason:
          err instanceof Error
            ? err.message.slice(0, 500)
            : String(err).slice(0, 500),
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", previewId)
      .eq("status", "processing")
  })
})
