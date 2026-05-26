import { Router, type IRouter } from "express"
import { updateMissingDirectorySeoMetrics } from "../jobs/update-directory-seo-metrics.js"

export const devPopulateMissingSeoMetricsRouter: IRouter = Router()

devPopulateMissingSeoMetricsRouter.post(
  "/dev-populate-missing-seo-metrics",
  async (_req, res) => {
    if (!process.env.APIFY_TOKEN) {
      res.status(500).json({ error: "APIFY_TOKEN not set" })
      return
    }

    try {
      await updateMissingDirectorySeoMetrics()
      res.json({ ok: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      res.status(502).json({ error: msg })
    }
  }
)
