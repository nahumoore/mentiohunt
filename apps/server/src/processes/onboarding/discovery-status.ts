import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("onboarding-discovery-status")

export async function setInitialDiscoveryStatus(productId: string): Promise<void> {
  const { error } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .update({
      discovery_status: {
        backlinks: "running",
        pages: "running",
        started_at: new Date().toISOString(),
        total: 2,
      },
    })
    .eq("product_id", productId)

  if (error) {
    log.error("failed to set initial discovery_status", { productId, error: error.message })
  }
}

export async function setEngineStatus(
  productId: string,
  engine: string,
  status: "running" | "done" | "failed"
): Promise<void> {
  await supabaseAdmin.rpc("merge_discovery_status" as string, {
    p_product_id: productId,
    p_updates: { [engine]: status },
  })
}
