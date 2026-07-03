import { Router, type IRouter } from "express"
import { updateDirectorySeoMetrics } from "../jobs/update-directory-seo-metrics.js"

export const devUpdateAllSeoMetricsRouter: IRouter = Router()

devUpdateAllSeoMetricsRouter.post(
  "/update-directory-seo-metrics",
  async (_req, res) => {
    if (!process.env.DATAFORSEO_LOGIN || !process.env.DATAFORSEO_PASSWORD) {
      res.status(500).json({ error: "DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD not set" })
      return
    }

    try {
      await updateDirectorySeoMetrics()
      res.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      res.status(502).json({ error: msg })
    }
  }
)
