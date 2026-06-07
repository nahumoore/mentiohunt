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
  maxPosts,
}: {
  configId: string
  userId: string
  sendEmailAlerts?: boolean
  maxPosts?: number
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

  await supabaseAdmin
    .from("reply_queue_configs")
    .update({ last_run_status: "running" })
    .eq("id", configId)

  const result = await withRouteLog(`run-reply-queue-${configId}`, () =>
    runReplyQueue({ configId, runId: run.id, sendEmailAlerts, maxPosts })
  )

  return { message: "Run complete", runId: run.id, ...result }
}

runReplyQueueRouter.post("/run/reply-queue", async (req, res) => {
  const productId =
    typeof req.body.productId === "string" ? req.body.productId.trim() : ""

  if (!productId) {
    res.status(400).json({ error: "productId is required" })
    return
  }

  const { data: config, error: configError } = await supabaseAdmin
    .from("reply_queue_configs")
    .select("id, user_id")
    .eq("product_id", productId)
    .eq("status", "active")
    .maybeSingle()

  if (configError || !config) {
    res.status(404).json({ error: "no reply queue config found for product" })
    return
  }

  try {
    const result = await runReplyQueueForConfig({
      configId: config.id,
      userId: config.user_id,
    })
    res.json(result)
  } catch (err) {
    log.error("unhandled run error", {
      productId,
      configId: config.id,
      error: String(err),
    })
    res.status(500).json({ error: String(err) })
  }
})
