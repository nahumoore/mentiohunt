import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import pLimit from "p-limit"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { checkTrackedLinkById } from "../methods/link-tracker/check-tracked-link.js"

const log = createLogger("route-link-tracker-check")

export const linkTrackerCheckRouter: IRouter = Router()

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

/**
 * Fired from apps/web right after a user submits a tracked link (single or
 * bulk), so the dashboard shows a real status within seconds instead of
 * waiting for the 03:30 UTC sweep. Fire-and-forget: responds 202 immediately,
 * same shape as /pages/crawl.
 */
linkTrackerCheckRouter.post("/link-tracker/check", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown>
  const trackedLinkId = typeof body?.trackedLinkId === "string" ? body.trackedLinkId.trim() : ""

  if (!trackedLinkId) {
    res.status(400).json({ error: "trackedLinkId is required" })
    return
  }

  res.status(202).json({ queued: true })

  withRouteLog(`link-tracker-check-${trackedLinkId}`, async () => {
    const result = await checkTrackedLinkById(trackedLinkId)
    if (!result) {
      log.warn("check-on-submit found nothing to check", { trackedLinkId })
      return
    }
    log.info("check-on-submit done", result)
  }).catch((err) => log.error("unhandled link-tracker check error", { trackedLinkId, error: String(err) }))
})

linkTrackerCheckRouter.post("/link-tracker/check-batch", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown>
  const trackedLinkIds = Array.isArray(body?.trackedLinkIds)
    ? body.trackedLinkIds.filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    : []

  if (trackedLinkIds.length === 0) {
    res.status(400).json({ error: "trackedLinkIds is required" })
    return
  }

  res.status(202).json({ queued: true, count: trackedLinkIds.length })

  withRouteLog(`link-tracker-check-batch-${trackedLinkIds.length}`, async () => {
    const limit = pLimit(5)
    await Promise.allSettled(
      trackedLinkIds.map((id) =>
        limit(async () => {
          try {
            await checkTrackedLinkById(id)
          } catch (err) {
            log.error("batch check failed", { trackedLinkId: id, error: String(err) })
          }
        })
      )
    )
  }).catch((err) => log.error("unhandled link-tracker batch check error", { error: String(err) }))
})
