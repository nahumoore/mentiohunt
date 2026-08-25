import cron from "node-cron"
import { runDailyBacklinkDiscovery } from "./daily-backlink-discovery.js"
import { runDailyLinkTracker } from "./daily-link-tracker.js"
import { deactivateExpiredFreeTrials } from "./deactivate-expired-free-trials.js"
import { runFeedbackEmailSequence } from "./feedback-email-sequence.js"
import { sendTrackedLinkDigests } from "./link-tracker-digest.js"
import { runProspectOutreachSender } from "./prospect-outreach-sender.js"
import { runProspectOutreachMonitor } from "./prospect-outreach-monitor.js"
import { checkScraperPoolHealth } from "./scraper-pool-health-monitor.js"
import { resumeEligibleTrialExpiredSequences } from "../helpers/outreach/trial-sequences.js"

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
      await resumeEligibleTrialExpiredSequences()
    } catch (err) {
      console.error("[cron] Error resuming trial-expired sequences:", err)
    }
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

  // :03 rather than :00 — the outreach sender fires every 5 min on the hour
  // (:00, :05, ...) and the monitor 2 min after (:02, :07, ...); landing here
  // instead avoids stacking this run's scraper volume on top of both in the
  // same 1-2 min window. See 2026-08-25-scraper-pool-slots-leak-on-hung-request.md.
  cron.schedule("3 7 * * *", async () => {
    try {
      await runDailyBacklinkDiscovery()
    } catch (err) {
      console.error("[cron] Error running daily backlink discovery:", err)
    }
  })
  console.log("[cron] Scheduled: daily backlink discovery, all active users (07:03 UTC)")

  cron.schedule("3 19 * * *", async () => {
    try {
      await runDailyBacklinkDiscovery({ paidOnly: true })
    } catch (err) {
      console.error("[cron] Error running paid-only backlink discovery:", err)
    }
  })
  console.log("[cron] Scheduled: 2nd backlink discovery run, paid users only (19:03 UTC)")

  cron.schedule("30 3 * * *", async () => {
    try {
      await runDailyLinkTracker()
    } catch (err) {
      console.error("[cron] Error running link tracker sweep:", err)
    }
  })
  console.log("[cron] Scheduled: link tracker sweep (03:30 UTC)")

  cron.schedule("30 15 * * *", async () => {
    try {
      await runDailyLinkTracker({ mode: "confirm" })
    } catch (err) {
      console.error("[cron] Error running link tracker confirmation pass:", err)
    }
  })
  console.log("[cron] Scheduled: link tracker confirmation pass, force_dynamic (15:30 UTC)")

  cron.schedule("0 17 * * *", async () => {
    try {
      await sendTrackedLinkDigests()
    } catch (err) {
      console.error("[cron] Error sending link tracker digests:", err)
    }
  })
  console.log("[cron] Scheduled: link tracker digest emails (17:00 UTC)")

  cron.schedule("*/2 * * * *", async () => {
    try {
      await checkScraperPoolHealth()
    } catch (err) {
      console.error("[cron] Error checking scraper pool health:", err)
    }
  })
  console.log("[cron] Scheduled: scraper pool health monitor (every 2 minutes)")
}
