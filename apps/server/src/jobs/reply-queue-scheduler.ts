import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendPendingMentionsLimitEmail } from "../helpers/emails/send-pending-mentions-limit.js"
import { createLogger } from "../helpers/logger.js"
import { runReplyQueue } from "../methods/reply-queue/run-reply-queue.js"

const log = createLogger("reply-queue-scheduler")

const RUN_DUE_HOURS = 20
const FREE_TRIAL_PENDING_LIMIT = 20

function isRunDue(lastRunAt: string | null): boolean {
  if (!lastRunAt) return true
  const hoursSince =
    (Date.now() - new Date(lastRunAt).getTime()) / (1000 * 60 * 60)
  return hoursSince >= RUN_DUE_HOURS
}

export async function runReplyQueueScheduler() {
  log.info("scheduler tick")

  const { data: configs, error } = await supabaseAdmin
    .from("reply_queue_configs")
    .select("id, user_id, last_run_at")
    .eq("status", "active")

  if (error) {
    log.error("failed to load configs", { error: error.message })
    return
  }

  if (!configs || configs.length === 0) {
    log.info("no active configs")
    return
  }

  for (const config of configs) {
    try {
      if (!isRunDue(config.last_run_at)) {
        log.info("run not due yet, skipping", { configId: config.id })
        continue
      }

      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("active_trial, email, tier")
        .eq("id", config.user_id)
        .single()

      if (!profile?.active_trial) {
        log.info("subscription not active, skipping", { configId: config.id })
        continue
      }

      const onPaidPlan = profile.tier === "pro" || profile.tier === "agency"

      const { count: pendingCount } = await supabaseAdmin
        .from("reply_queue_items")
        .select("id", { count: "exact", head: true })
        .eq("config_id", config.id)
        .eq("user_status", "new")

      if (!onPaidPlan && (pendingCount ?? 0) >= FREE_TRIAL_PENDING_LIMIT) {
        log.info("pending mention limit reached, skipping", {
          configId: config.id,
          pendingCount,
        })

        if (profile.email) {
          const { data: product } = await supabaseAdmin
            .from("reply_queue_configs")
            .select("products(product_name)")
            .eq("id", config.id)
            .single()

          const products = product?.products as
            | { product_name: string }
            | { product_name: string }[]
            | null
          const productName =
            (Array.isArray(products) ? products[0] : products)?.product_name ??
            "your product"

          await sendPendingMentionsLimitEmail({
            to: profile.email,
            userId: config.user_id,
            productName,
            pendingCount: pendingCount ?? FREE_TRIAL_PENDING_LIMIT,
          })
        }

        continue
      }

      const { data: run, error: runError } = await supabaseAdmin
        .from("reply_queue_runs")
        .insert({
          config_id: config.id,
          user_id: config.user_id,
          status: "running",
        })
        .select("id")
        .single()

      if (runError || !run) {
        log.error("failed to create run record", {
          configId: config.id,
          error: runError?.message,
        })
        continue
      }

      log.info("firing run", { configId: config.id, runId: run.id })

      runReplyQueue({ configId: config.id, runId: run.id }).catch((err) => {
        log.error("unhandled run error", {
          configId: config.id,
          runId: run.id,
          error: String(err),
        })
      })
    } catch (err) {
      log.error("error processing config", {
        configId: config.id,
        error: String(err),
      })
    }
  }
}
