import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("unlinked-mention-prospect-run")

/**
 * Rotate through the query pool so the same SERP query doesn't re-run every
 * day — same least-recently-run selection as selectQueriesForRun in
 * listicle-roundup/prospect-run-tracking.ts. Runs recorded before query
 * rotation existed only stored brand_terms, so their queries read as
 * never-run, which is the right bias.
 */
export async function selectQueriesForRun(
  productId: string,
  allQueries: string[],
  maxQueries: number
): Promise<string[]> {
  const { data: recentRuns } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("input, completed_at")
    .eq("product_id", productId)
    .eq("strategy", "unlinked_mention")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const lastRunByQuery = new Map<string, string>()
  for (const run of (recentRuns ?? []) as Array<{
    input: { queries?: string[] } | null
    completed_at: string | null
  }>) {
    for (const query of run.input?.queries ?? []) {
      if (!lastRunByQuery.has(query)) {
        lastRunByQuery.set(query, run.completed_at ?? "")
      }
    }
  }

  return [...allQueries]
    .sort((a, b) => {
      const aTime = lastRunByQuery.get(a) ?? ""
      const bTime = lastRunByQuery.get(b) ?? ""
      return aTime < bTime ? -1 : 1
    })
    .slice(0, maxQueries)
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
