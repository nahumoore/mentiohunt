import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { runReplyQueue } from "../methods/reply-queue/run-reply-queue.js"

const log = createLogger("route-run-reply-queue")

export const runReplyQueueRouter: IRouter = Router()

export async function runReplyQueueForConfig({
  configId,
  userId,
  sendEmailAlerts = true,
}: {
  configId: string
  userId: string
  sendEmailAlerts?: boolean
}) {
  const { data: run, error } = await supabaseAdmin
    .from("reply_queue_runs")
    .insert({ config_id: configId, user_id: userId, status: "running" })
    .select("id")
    .single()

  if (error || !run) {
    log.error("failed to create run record", { error: error?.message })
    throw new Error("Failed to create run")
  }

  const result = await withRouteLog(`run-reply-queue-${configId}`, () =>
    runReplyQueue({ configId, runId: run.id, sendEmailAlerts })
  )

  return { message: "Run complete", runId: run.id, ...result }
}

runReplyQueueRouter.post("/run/reply-queue", async (req, res) => {
  const configId =
    typeof req.body.configId === "string" ? req.body.configId.trim() : ""
  const userId =
    typeof req.body.userId === "string" ? req.body.userId.trim() : ""

  if (!configId || !userId) {
    res.status(400).json({ error: "configId and userId are required" })
    return
  }

  try {
    const result = await runReplyQueueForConfig({ configId, userId })
    res.json(result)
  } catch (err) {
    log.error("unhandled run error", {
      configId,
      error: String(err),
    })
    res.status(500).json({ error: String(err) })
  }
})
