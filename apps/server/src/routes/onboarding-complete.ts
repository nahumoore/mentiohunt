import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { createLogger, withRouteLog } from "../helpers/logger.js"
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

  const body = req.body !== null && typeof req.body === "object" ? (req.body as Record<string, unknown>) : {}
  const rawCrawlLimit = Number(body["crawlLimit"] ?? body["pageLimit"])
  const crawlLimit = Number.isFinite(rawCrawlLimit) && rawCrawlLimit > 0 ? rawCrawlLimit : 50

  res.status(202).json({ queued: true })

  withRouteLog(`onboarding-complete-${productId}`, () =>
    runOnboardingJobs(userId, productId, crawlLimit)
  ).catch((err) => log.error("unhandled onboarding jobs error", { error: String(err) }))
})
