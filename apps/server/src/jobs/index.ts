import cron from "node-cron"
import { updateDirectorySeoMetrics } from "./update-directory-seo-metrics.js"
import { runReplyQueueScheduler } from "./reply-queue-scheduler.js"
import { runWeeklyDirectoryCheck } from "./weekly-directory-submission-check.js"

export function registerJobs(): void {
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

  cron.schedule("0 0 * * *", async () => {
    try {
      await runReplyQueueScheduler()
    } catch (err) {
      console.error("[cron] Error running reply queue scheduler:", err)
    }
  })
  console.log("[cron] Scheduled: reply queue scheduler (daily at midnight UTC)")

  cron.schedule("0 3 * * 1", async () => {
    try {
      await runWeeklyDirectoryCheck()
    } catch (err) {
      console.error("[cron] Error running weekly directory check:", err)
    }
  })
  console.log("[cron] Scheduled: weekly directory submission check (Mon 03:00 UTC)")
}
