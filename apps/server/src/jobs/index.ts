import cron from "node-cron"
import { runDailyBacklinkDiscovery } from "./daily-backlink-discovery.js"
import { deactivateExpiredFreeTrials } from "./deactivate-expired-free-trials.js"
import { runFeedbackEmailSequence } from "./feedback-email-sequence.js"
import { runProspectOutreachSender } from "./prospect-outreach-sender.js"
import { runProspectOutreachMonitor } from "./prospect-outreach-monitor.js"

export function registerJobs(): void {
  // cron.schedule("0 2 1 * *", async () => {
  //   try {
  //     await updateDirectorySeoMetrics()
  //   } catch (err) {
  //     console.error("[cron] Error updating directory SEO metrics:", err)
  //   }
  // })
  // console.log(
  //   "[cron] Scheduled: directory SEO metrics update (1st of each month)"
  // )

  cron.schedule("15 0,8,16 * * *", async () => {
    try {
      await deactivateExpiredFreeTrials()
    } catch (err) {
      console.error("[cron] Error deactivating expired free trials:", err)
    }
  })
  console.log(
    "[cron] Scheduled: free trial deactivation (00:15, 08:15, 16:15 UTC)"
  )

  cron.schedule("0 * * * *", async () => {
    try {
      await runFeedbackEmailSequence()
    } catch (err) {
      console.error("[cron] Error running feedback email sequence:", err)
    }
  })
  console.log("[cron] Scheduled: feedback email sequence (hourly)")

  cron.schedule("*/5 * * * *", async () => {
    try {
      await runProspectOutreachSender()
    } catch (err) {
      console.error("[cron] Error running prospect outreach sender:", err)
    }
  })
  console.log("[cron] Scheduled: prospect outreach sender (every 5 minutes)")

  cron.schedule("2-59/5 * * * *", async () => {
    try {
      await runProspectOutreachMonitor()
    } catch (err) {
      console.error("[cron] Error running prospect outreach monitor:", err)
    }
  })
  console.log("[cron] Scheduled: prospect outreach monitor (every 5 minutes)")

  cron.schedule("0 7 * * *", async () => {
    try {
      await runDailyBacklinkDiscovery()
    } catch (err) {
      console.error("[cron] Error running daily backlink discovery:", err)
    }
  })
  console.log("[cron] Scheduled: daily backlink discovery (07:00 UTC)")
}
