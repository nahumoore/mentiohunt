import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../../helpers/logger.js"
import { withCompletedRunHealth, withFailedRunHealth } from "../shared/run-health.js"

const log = createLogger("competitor-backlink-prospect-run")
const EXHAUSTED_RECHECK_MS = 30 * 24 * 60 * 60 * 1_000

export async function getLastMozCursor(
  productId: string,
  competitorDomain: string
): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from("backlink_prospect_runs")
    .select("metadata")
    .eq("product_id", productId)
    .eq("strategy", "competitor_backlink")
    .eq("status", "completed")
    .contains("input" as string, { competitor_domains: [competitorDomain] })
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const metadata = (data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? null
  const mozCursors = (metadata?.moz_cursors as Record<string, string> | null) ?? {}
  return mozCursors[competitorDomain] ?? null
}

export async function getLastCompetitorRefresh(
  productId: string
): Promise<{ refreshedAt: string; domains: string[] } | null> {
  const { data } = await supabaseAdmin
    .from("backlink_prospect_runs")
    .select("metadata")
    .eq("product_id", productId)
    .eq("strategy", "competitor_backlink")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })
    .limit(30)

  for (const run of (data ?? []) as Array<{
    metadata: { competitor_refresh_at?: string; inferred_competitors?: string[] } | null
  }>) {
    if (run.metadata?.competitor_refresh_at) {
      return {
        refreshedAt: run.metadata.competitor_refresh_at,
        domains: run.metadata.inferred_competitors ?? [],
      }
    }
  }
  return null
}

export async function selectCompetitorsForRun(
  productId: string,
  allDomains: string[],
  maxCompetitors: number
): Promise<string[]> {
  const { data: recentRuns } = await supabaseAdmin
    .from("backlink_prospect_runs")
    .select("input, completed_at, metadata")
    .eq("product_id", productId)
    .eq("strategy", "competitor_backlink")
    .eq("status", "completed")
    .order("completed_at", { ascending: false })

  const lastRunByDomain = new Map<string, string>()
  const exhaustedAtByDomain = new Map<string, string>()
  for (const run of (recentRuns ?? []) as Array<{
    input: { competitor_domains?: string[] } | null
    completed_at: string | null
    metadata: { exhausted_competitor_domains?: string[] } | null
  }>) {
    for (const domain of run.input?.competitor_domains ?? []) {
      if (!lastRunByDomain.has(domain)) {
        lastRunByDomain.set(domain, run.completed_at ?? "")
      }
    }
    for (const domain of run.metadata?.exhausted_competitor_domains ?? []) {
      if (!exhaustedAtByDomain.has(domain)) {
        exhaustedAtByDomain.set(domain, run.completed_at ?? "")
      }
    }
  }

  return [...allDomains]
    .filter((domain) => {
      const exhaustedAt = exhaustedAtByDomain.get(domain)
      if (!exhaustedAt) return true
      return Date.now() - new Date(exhaustedAt).getTime() >= EXHAUSTED_RECHECK_MS
    })
    .sort((a, b) => {
      const aTime = lastRunByDomain.get(a) ?? ""
      const bTime = lastRunByDomain.get(b) ?? ""
      return aTime < bTime ? -1 : 1
    })
    .slice(0, maxCompetitors)
}

export async function createProspectRun(productId: string, competitorDomains: string[]): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs")
    .insert({
      product_id: productId,
      strategy: "competitor_backlink",
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
  mozCursorsByDomain: Record<string, string | null> = {},
  extraMetadata?: Record<string, unknown>
): Promise<void> {
  const validCursors = Object.fromEntries(
    Object.entries(mozCursorsByDomain).filter(([, v]) => v !== null)
  )
  const metadata = {
    ...(Object.keys(validCursors).length > 0 ? { moz_cursors: validCursors } : {}),
    ...extraMetadata,
  }
  await supabaseAdmin
    .from("backlink_prospect_runs")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
      metadata: withCompletedRunHealth(metadata),
    })
    .eq("id", runId)
}

export async function failProspectRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs")
    .update({ status: "failed", completed_at: new Date().toISOString(), error, metadata: withFailedRunHealth() })
    .eq("id", runId)
}
