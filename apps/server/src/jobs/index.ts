import cron from "node-cron"
import { updateDirectorySeoMetrics } from "./update-directory-seo-metrics.js"

export function registerJobs(): void {
  // Every 1st of the month at 02:00 UTC
  cron.schedule("0 2 1 * *", async () => {
    try {
      await updateDirectorySeoMetrics()
    } catch (err) {
      console.error("[cron] Error updating directory SEO metrics:", err)
    }
  })
  console.log(
    "[cron] Scheduled: directory SEO metrics update (1st of each month)"
  )
}
