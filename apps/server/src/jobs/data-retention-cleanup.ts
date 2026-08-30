import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../helpers/logger.js"

const log = createLogger("data-retention-cleanup")

const OUTREACH_EVENTS_RETENTION_DAYS = 180
const ROUTE_EXECUTION_LOGS_RETENTION_DAYS = 30
const BATCH_SIZE = 1000

function cutoffIso(days: number): string {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
}

/**
 * outreach_events is written to every 5 minutes by the outreach sender/monitor
 * jobs (jobs/index.ts), so this deletes in small batches rather than one large
 * DELETE to avoid holding a long lock against those concurrent writers. See
 * todo/tickets/2026-08-26-outreach-events-route-logs-retention.md.
 */
async function pruneOutreachEvents(): Promise<number> {
  const cutoff = cutoffIso(OUTREACH_EVENTS_RETENTION_DAYS)
  let totalDeleted = 0

  while (true) {
    const { data, error } = await supabaseAdmin
      .from("outreach_events")
      .delete()
      .lt("created_at", cutoff)
      .select("id")
      .limit(BATCH_SIZE)

    if (error) {
      log.error("failed to prune outreach_events", { error: error.message, totalDeleted })
      break
    }

    const deleted = data?.length ?? 0
    totalDeleted += deleted
    if (deleted < BATCH_SIZE) break
  }

  return totalDeleted
}

async function pruneRouteExecutionLogs(): Promise<number> {
  const cutoff = cutoffIso(ROUTE_EXECUTION_LOGS_RETENTION_DAYS)

  const { data, error } = await supabaseAdmin
    .from("route_execution_logs")
    .delete()
    .lt("started_at", cutoff)
    .select("id")

  if (error) {
    log.error("failed to prune route_execution_logs", { error: error.message })
    return 0
  }

  return data?.length ?? 0
}

export async function runDataRetentionCleanup(): Promise<void> {
  log.info("starting")

  const outreachEventsDeleted = await pruneOutreachEvents()
  const routeExecutionLogsDeleted = await pruneRouteExecutionLogs()

  log.info("complete", { outreachEventsDeleted, routeExecutionLogsDeleted })
}
