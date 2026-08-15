import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"

const log = createLogger("broken-link-building-prospect-run")

/**
 * Same cursor/rotation mechanics as competitor-backlink's
 * prospect-run-tracking.ts, but keyed off `strategy = "broken_link_building"`
 * so a competitor's pagination through its backlink profile is tracked
 * independently per strategy — the same competitor is fetched from a
 * different cursor position by each strategy that reads its backlinks.
 */
export async function getLastCursor(productId: string, competitorDomain: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("metadata")
    .eq("product_id", productId)
    .eq("strategy", "broken_link_building")
    .eq("status", "completed")
    .contains("input" as string, { competitor_domains: [competitorDomain] })
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const metadata = (data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? null
  const cursors = (metadata?.moz_cursors as Record<string, string> | null) ?? {}
  return cursors[competitorDomain] ?? null
}

export async function selectCompetitorsForRun(
  productId: string,
  allDomains: string[],
  maxCompetitors: number
): Promise<string[]> {
  const { data: recentRuns } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("input, completed_at")
    .eq("product_id", productId)
    .eq("strategy", "broken_link_building")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const lastRunByDomain = new Map<string, string>()
  for (const run of (recentRuns ?? []) as Array<{ input: { competitor_domains?: string[] } | null; completed_at: string | null }>) {
    for (const domain of run.input?.competitor_domains ?? []) {
      if (!lastRunByDomain.has(domain)) {
        lastRunByDomain.set(domain, run.completed_at ?? "")
      }
    }
  }

  return [...allDomains]
    .sort((a, b) => {
      const aTime = lastRunByDomain.get(a) ?? ""
      const bTime = lastRunByDomain.get(b) ?? ""
      return aTime < bTime ? -1 : 1
    })
    .slice(0, maxCompetitors)
}

export async function createProspectRun(productId: string, competitorDomains: string[]): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({
      product_id: productId,
      strategy: "broken_link_building",
      input: { competitor_domains: competitorDomains },
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

export async function completeProspectRun(
  runId: string,
  prospectsCreated: number,
  costUsd: number,
  cursorsByDomain: Record<string, string | null> = {},
  extraMetadata?: Record<string, unknown>
): Promise<void> {
  const validCursors = Object.fromEntries(Object.entries(cursorsByDomain).filter(([, v]) => v !== null))
  const metadata = {
    ...(Object.keys(validCursors).length > 0 ? { moz_cursors: validCursors } : {}),
    ...extraMetadata,
  }
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
      metadata: Object.keys(metadata).length > 0 ? metadata : null,
    })
    .eq("id", runId)
}

export async function failProspectRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}
