import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("unlinked-mention-prospect-run")

/**
 * Rotate through the query pool so the same SERP query doesn't re-run every
 * day. Slides a `maxQueries`-wide window forward by 1 query per completed
 * run (wrapping around the pool), rather than picking by last-run
 * timestamp — a timestamp-based LRU sort ties every query selected in the
 * same run together forever (they always share one completed_at), which
 * splits an N-query pool into fixed, non-overlapping groups of `maxQueries`
 * that repeat in lockstep instead of rotating through every combination.
 */
export async function selectQueriesForRun(
  productId: string,
  allQueries: string[],
  maxQueries: number
): Promise<string[]> {
  const poolSize = allQueries.length
  if (poolSize === 0) return []

  const { count } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("id", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("strategy", "unlinked_mention")
    .eq("status", "completed")

  const start = (count ?? 0) % poolSize
  const windowSize = Math.min(maxQueries, poolSize)
  return Array.from({ length: windowSize }, (_, i) => allQueries[(start + i) % poolSize] as string)
}

/** Date (YYYY-MM-DD) of the most recent completed run, for the `after:` freshness query. */
export async function getLastCompletedRunDate(productId: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("completed_at")
    .eq("product_id", productId)
    .eq("strategy", "unlinked_mention")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const completedAt = (data as { completed_at: string | null } | null)?.completed_at
  return completedAt ? completedAt.slice(0, 10) : null
}

export async function createProspectRun(
  productId: string,
  brandTerms: string[],
  queries: string[]
): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({
      product_id: productId,
      strategy: "unlinked_mention",
      input: { brand_terms: brandTerms, queries },
      status: "running",
    })
    .select("id")
    .single()

  if (error) {
    log.warn("failed to create prospect run", { productId, error: error.message })
    return null
  }
  return (data as { id: string }).id
}

export async function completeProspectRun(runId: string, prospectsCreated: number, costUsd: number): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
    })
    .eq("id", runId)
}

export async function failProspectRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}
