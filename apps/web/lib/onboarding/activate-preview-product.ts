import { supabaseAdmin } from "@workspace/supabase/admin"
import { startDiscoveryJobs } from "./start-discovery-jobs"

/**
 * Atomically claims activated discovery for a preview product. Stripe's webhook
 * and browser return route can race; only the winner dispatches the job.
 */
export async function activatePreviewProduct({
  userId,
  productId,
  crawlLimit,
  autoDiscoverPages,
}: {
  userId: string
  productId: string
  crawlLimit: number
  autoDiscoverPages: boolean
}): Promise<boolean> {
  const claimedAt = new Date().toISOString()
  const { data: preview, error } = await supabaseAdmin
    .from("onboarding_previews")
    .update({ activation_requested_at: claimedAt })
    .eq("user_id", userId)
    .eq("product_id", productId)
    .is("activation_requested_at", null)
    .select("id")
    .maybeSingle()

  if (error) throw new Error(error.message)
  if (!preview) return false

  try {
    await startDiscoveryJobs({
      userId,
      productId,
      crawlLimit,
      autoDiscoverPages,
      activatePreview: true,
    })
    return true
  } catch (error) {
    await supabaseAdmin
      .from("onboarding_previews")
      .update({ activation_requested_at: null })
      .eq("id", preview.id)
      .eq("activation_requested_at", claimedAt)
    throw error
  }
}
