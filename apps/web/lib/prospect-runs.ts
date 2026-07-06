import type { Tables } from "@workspace/supabase/database-types"

export type ProspectRunItem = Pick<
  Tables<"backlink_prospect_runs">,
  "id" | "strategy" | "status" | "prospects_created" | "started_at" | "completed_at"
>

export const PROSPECT_RUN_COLUMNS =
  "id, strategy, status, prospects_created, started_at, completed_at"

// Covers the latest batch of up to 3 strategy runs plus a little history.
export const PROSPECT_RUN_FETCH_LIMIT = 9

export function isDiscoveryRunning(runs: ProspectRunItem[]): boolean {
  return runs.some((run) => run.status === "running" || run.status === "pending")
}

export function computeHasCompletedRun(runs: ProspectRunItem[]): boolean {
  return runs.length > 0 && !isDiscoveryRunning(runs)
}
