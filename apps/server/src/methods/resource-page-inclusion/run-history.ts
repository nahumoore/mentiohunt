import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../helpers/logger.js"
import { queryKey, readObjectArray, readStringArray, rememberLatest } from "./helpers.js"
import type { RunHistory } from "./types.js"

const log = createLogger("resource-page-inclusion-run-history")

export async function loadRunHistory(productId: string): Promise<RunHistory> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("input, started_at, completed_at")
    .eq("product_id", productId)
    .eq("strategy", "resource_page_inclusion")
    .in("status", ["running", "completed"])
    .order("started_at", { ascending: false })
    .limit(50)

  if (error) {
    log.warn("failed to load run history", { productId, error: error.message })
    return { runsConsidered: 0, lastRunByPageId: new Map(), lastRunByQueryKey: new Map() }
  }

  const lastRunByPageId = new Map<string, string>()
  const lastRunByQueryKey = new Map<string, string>()

  for (const run of (data ?? []) as Array<{ input: unknown; started_at: string | null; completed_at: string | null }>) {
    const input = run.input !== null && typeof run.input === "object" ? (run.input as Record<string, unknown>) : null
    if (!input) continue

    const timestamp = run.completed_at ?? run.started_at ?? ""
    for (const pageId of readStringArray(input.target_page_ids)) {
      rememberLatest(lastRunByPageId, pageId, timestamp)
    }

    for (const page of readObjectArray(input.selected_pages)) {
      if (typeof page.id === "string") rememberLatest(lastRunByPageId, page.id, timestamp)
    }

    for (const query of readObjectArray(input.queries)) {
      if (typeof query.target_page_id === "string" && typeof query.query === "string") {
        rememberLatest(lastRunByQueryKey, queryKey(query.target_page_id, query.query), timestamp)
      }
    }
  }

  return { runsConsidered: data?.length ?? 0, lastRunByPageId, lastRunByQueryKey }
}
