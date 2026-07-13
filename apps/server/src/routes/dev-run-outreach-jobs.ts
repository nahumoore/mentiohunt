import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { runProspectOutreachSender } from "../jobs/prospect-outreach-sender.js"
import { runProspectOutreachMonitor } from "../jobs/prospect-outreach-monitor.js"

const log = createLogger("route-dev-run-outreach-jobs")

export const devRunOutreachJobsRouter: IRouter = Router()

devRunOutreachJobsRouter.post("/dev/run-outreach-sender", async (req, res) => {
  const { userId, bypassSendWindow = true } = req.body as { userId?: string; bypassSendWindow?: boolean }

  await withRouteLog("dev-run-outreach-sender", async () => {
    try {
      await runProspectOutreachSender(userId, bypassSendWindow)
      res.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { error: msg })
      res.status(502).json({ error: msg })
    }
  })
})

devRunOutreachJobsRouter.post("/dev/run-outreach-monitor", async (req, res) => {
  const { userId } = req.body as { userId?: string }

  await withRouteLog("dev-run-outreach-monitor", async () => {
    try {
      await runProspectOutreachMonitor(userId)
      res.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
