import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json } from "@workspace/supabase/database-types"
import { createLogger } from "../helpers/logger.js"
import { utcQuotaDate } from "./daily-discovery-policy.js"

const log = createLogger("daily-discovery-accounting")

export type DailyExecutionClaim = {
  summaryId: string
  executionToken: string
  quotaDate: string
  readyCount: number
  previousAttempts: number
  previousCostUsd: number
}

export type DailyExecutionFinish = {
  readyCount: number
  enrichmentAttempts: number
  insertedNotReadyCount: number
  costUsd: number
  strategyFunnels: Json[]
  stopReason: string
  configurationReason?: string
  lastError?: string
}

export async function claimDailyExecution(
  productId: string,
  target: number,
  now = new Date()
): Promise<DailyExecutionClaim | null> {
  const quotaDate = utcQuotaDate(now)
  const { data, error } = await supabaseAdmin.rpc(
    "claim_daily_discovery_execution",
    {
      p_product_id: productId,
      p_quota_date: quotaDate,
      p_target_count: target,
      p_stale_after_seconds: 2 * 60 * 60,
    }
  )

  if (error)
    throw new Error(
      `Failed to claim daily discovery execution: ${error.message}`
    )
  const claim = data?.[0]
  if (!claim?.claimed || !claim.execution_token) return null

  return {
    summaryId: claim.summary_id,
    executionToken: claim.execution_token,
    quotaDate,
    readyCount: claim.ready_count,
    previousAttempts: claim.enrichment_attempts,
    previousCostUsd: Number(claim.total_cost_usd),
  }
}

export async function countDailySendReady(
  productId: string,
  quotaDate: string
): Promise<number> {
  const { data, error } = await supabaseAdmin.rpc(
    "count_daily_send_ready_opportunities",
    {
      p_product_id: productId,
      p_quota_date: quotaDate,
    }
  )
  if (error)
    throw new Error(
      `Failed to count daily send-ready opportunities: ${error.message}`
    )
  return data ?? 0
}

export async function finishDailyExecution(
  claim: DailyExecutionClaim,
  result: DailyExecutionFinish
): Promise<void> {
  const { data, error } = await supabaseAdmin.rpc(
    "finish_daily_discovery_execution",
    {
      p_summary_id: claim.summaryId,
      p_execution_token: claim.executionToken,
      p_ready_count: result.readyCount,
      p_enrichment_attempts: result.enrichmentAttempts,
      p_inserted_not_ready_count: result.insertedNotReadyCount,
      p_cost_usd: result.costUsd,
      p_strategy_funnels: result.strategyFunnels,
      p_stop_reason: result.stopReason,
      p_configuration_reason: result.configurationReason,
      p_last_error: result.lastError,
    }
  )

  if (error)
    throw new Error(
      `Failed to finish daily discovery execution: ${error.message}`
    )
  if (!data) {
    log.warn(
      "daily execution finish ignored because its lock was no longer current",
      {
        summaryId: claim.summaryId,
      }
    )
  }
}
