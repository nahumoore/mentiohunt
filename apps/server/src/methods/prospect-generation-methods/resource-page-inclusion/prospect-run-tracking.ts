import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("resource-page-inclusion-prospect-run")

export async function createProspectRun(productId: string, input: unknown, dryRun: boolean): Promise<string | null> {
  if (dryRun) return null

  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({
      product_id: productId,
      strategy: "resource_page_inclusion",
      input,
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
  runId: string | null,
  prospectsCreated: number,
  costUsd: number,
  metadata?: unknown
): Promise<void> {
  if (!runId) return
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      prospects_created: prospectsCreated,
      cost_usd: costUsd,
      metadata: metadata ?? null,
    })
    .eq("id", runId)
}

export async function failProspectRun(runId: string | null, error: string): Promise<void> {
  if (!runId) return
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}
