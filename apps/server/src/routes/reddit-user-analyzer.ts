import { timingSafeEqual } from "node:crypto"
import { Router, type IRouter } from "express"
import { withRouteLog } from "../helpers/logger.js"
import { checkRateLimit } from "../helpers/rate-limit.js"
import { extractUsername, fetchRedditUserData } from "../methods/reddit/fetch-user-data.js"
import { analyzeRedditUser } from "../methods/reddit/analyze-reddit-user.js"

export const redditUserAnalyzerRouter: IRouter = Router()

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

redditUserAnalyzerRouter.post("/reddit-user-analyzer", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const clientIp = req.header("x-forwarded-client-ip") ?? "unknown"
  const { allowed } = checkRateLimit("reddit-user-analyzer", clientIp)
  if (!allowed) {
    res.status(429).json({ error: "Daily limit reached. Come back tomorrow." })
    return
  }

  const rawInput =
    typeof req.body.username === "string" ? req.body.username.trim() : ""

  if (!rawInput) {
    res.status(400).json({ error: "username is required" })
    return
  }

  const rawUsername = extractUsername(rawInput)

  if (!/^[a-zA-Z0-9_-]{3,20}$/.test(rawUsername)) {
    res.status(400).json({ error: "Invalid Reddit username." })
    return
  }

  try {
    const result = await withRouteLog(`reddit-user-analyzer-${rawUsername}`, async () => {
      const userData = await fetchRedditUserData(rawUsername)
      return analyzeRedditUser(userData)
    })
    res.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)

    if (message === "reddit_user_not_found") {
      res.status(404).json({ error: "Reddit user not found. Check the username and try again." })
      return
    }
    if (message === "reddit_user_private_or_suspended") {
      res.status(400).json({ error: "This account is suspended or has a private profile." })
      return
    }
    if (message.startsWith("reddit_api_error_429")) {
      res.status(429).json({ error: "Reddit is rate limiting requests. Try again in a moment." })
      return
    }

    res.status(500).json({ error: "Something went wrong. Please try again." })
  }
})
