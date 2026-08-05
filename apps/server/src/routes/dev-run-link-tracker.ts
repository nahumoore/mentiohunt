import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { runDailyLinkTracker } from "../jobs/daily-link-tracker.js"
import { sendTrackedLinkDigests } from "../jobs/link-tracker-digest.js"
import { checkTrackedLinkById } from "../methods/link-tracker/check-tracked-link.js"

const log = createLogger("route-dev-run-link-tracker")

export const devRunLinkTrackerRouter: IRouter = Router()

devRunLinkTrackerRouter.post("/dev/run-link-tracker", async (req, res) => {
  const {
    trackedLinkId,
    productId,
    mode,
    skipEligibilityCheck,
  } = req.body as {
    trackedLinkId?: string
    productId?: string
    mode?: "sweep" | "confirm" | "digest"
    skipEligibilityCheck?: boolean
  }

  await withRouteLog(`dev-run-link-tracker-${mode ?? "sweep"}`, async () => {
    try {
      // Single-link mode: exercise the exact path apps/web hits on submit,
      // and the fastest way to test a hand-edited row without waiting for a
      // scheduled sweep.
      if (trackedLinkId) {
        const result = await checkTrackedLinkById(trackedLinkId, { forceDynamic: mode === "confirm" })
        if (!result) {
          res.status(404).json({ error: "tracked link or its product not found" })
          return
        }
        log.info("single-link check done", result)
        res.json({ ok: true, result })
        return
      }

      if (mode === "digest") {
        await sendTrackedLinkDigests()
        res.json({ ok: true, mode: "digest" })
        return
      }

      await runDailyLinkTracker({
        mode: mode === "confirm" ? "confirm" : "sweep",
        productId,
        skipEligibilityCheck: !!skipEligibilityCheck,
      })
      res.json({ ok: true, mode: mode ?? "sweep", productId: productId ?? null })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      log.error("failed", { error: msg })
      res.status(502).json({ error: msg })
    }
  })
})
