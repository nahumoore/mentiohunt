import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendOnboardingCompleteEmail } from "../../helpers/emails/send-onboarding-complete.js"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("onboarding-summary-email")

export async function sendOnboardingSummaryEmail({
  userId,
  productId,
  backlinkDiscoveryResult,
  pagesResult,
}: {
  userId: string
  productId: string
  backlinkDiscoveryResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
  pagesResult: PromiseSettledResult<{
    candidatesFound: number
    pagesCrawled: number
    pagesSelected: number
    pagesFailed: number
    totalCostUsd: number
  }>
}): Promise<void> {
  const [
    { data: profile, error: profileError },
    { data: product, error: productError },
  ] = await Promise.all([
    supabaseAdmin.from("profiles").select("email, name").eq("id", userId).single(),
    supabaseAdmin
      .from("products")
      .select("product_name")
      .eq("id", productId)
      .eq("user_id", userId)
      .single(),
  ])

  if (profileError || !profile?.email) {
    log.warn("could not send onboarding summary email without profile email", {
      userId,
      error: profileError?.message,
    })
    return
  }

  if (productError || !product?.product_name) {
    log.warn("could not send onboarding summary email without product name", {
      productId,
      error: productError?.message,
    })
    return
  }

  await sendOnboardingCompleteEmail({
    to: profile.email,
    userId,
    userName: profile.name,
    productName: product.product_name,
    backlinkResult: backlinkDiscoveryResult,
    pagesResult,
  })
}
