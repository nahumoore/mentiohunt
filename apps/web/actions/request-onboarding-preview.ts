"use server"

import { onboardingSchema, type OnboardingData } from "@/consts/onboarding"
import { FREE_TRIAL_MAX_PAGES } from "@/consts/billing"
import { DEFAULT_DISCOVERY_SETTINGS } from "@/lib/discovery-defaults"
import { DEFAULT_PROSPECT_TIERS } from "@/lib/opportunity-types"
import { startPreviewJobs } from "@/lib/onboarding/start-discovery-jobs"
import {
  extractHostname,
  validateDomains,
} from "@/lib/onboarding/validate-domain"
import { supabaseServer } from "@/lib/supabase/server"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { TablesInsert } from "@workspace/supabase/database-types"
import disposableDomains from "disposable-email-domains"
import disposableWildcards from "disposable-email-domains/wildcard.json"

const DISPOSABLE_DOMAINS = new Set(disposableDomains as string[])
const DISPOSABLE_WILDCARDS = disposableWildcards as string[]

export type RequestPreviewResult =
  | { ok: true; previewId: string }
  | { ok: false; message: string }

/**
 * Persists onboarding before starting background work. The durable preview row
 * is the idempotency key, so refreshes and double-submits reuse the same product.
 */
export async function requestOnboardingPreview(
  input: OnboardingData
): Promise<RequestPreviewResult> {
  const supabase = await supabaseServer()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user?.email) return { ok: false, message: "Sign in again to continue." }
  if (!user.email_confirmed_at) {
    return {
      ok: false,
      message: "Confirm your email before requesting a preview.",
    }
  }
  const emailDomain = user.email.split("@").at(-1)?.toLowerCase() ?? ""
  if (
    DISPOSABLE_DOMAINS.has(emailDomain) ||
    DISPOSABLE_WILDCARDS.some(
      (suffix) => emailDomain === suffix || emailDomain.endsWith(`.${suffix}`)
    )
  ) {
    return {
      ok: false,
      message: "Use a permanent work email to request a preview.",
    }
  }

  const parsed = onboardingSchema.safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Review your setup.",
    }
  }

  const data = parsed.data
  const websiteDomain = extractHostname(data.websiteUrl)
  if (!websiteDomain)
    return { ok: false, message: "Enter a valid website URL." }

  const { data: existing } = await supabaseAdmin
    .from("onboarding_previews")
    .select("id, product_id, status")
    .eq("user_id", user.id)
    .eq("website_domain", websiteDomain)
    .maybeSingle()

  if (existing) {
    if (existing.status === "pending" || existing.status === "failed") {
      if (existing.status === "failed") {
        await supabaseAdmin
          .from("onboarding_previews")
          .update({
            status: "pending",
            failure_reason: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existing.id)
          .eq("status", "failed")
      }

      try {
        await startPreviewJobs({
          userId: user.id,
          productId: existing.product_id,
          previewId: existing.id,
          crawlLimit: FREE_TRIAL_MAX_PAGES,
          autoDiscoverPages: data.autoDiscoverPages,
        })
      } catch (error) {
        await supabaseAdmin
          .from("onboarding_previews")
          .update({
            status: "failed",
            failure_reason: String(error).slice(0, 500),
          })
          .eq("id", existing.id)
      }
    }
    return { ok: true, previewId: existing.id }
  }

  const onSiteFiltered = data.competitors.filter((competitor) => {
    const competitorHostname = extractHostname(competitor)
    return (
      competitorHostname !== websiteDomain &&
      !competitorHostname.endsWith(`.${websiteDomain}`)
    )
  })
  const { valid: competitors } = await validateDomains(onSiteFiltered)

  const productPayload: TablesInsert<"products"> = {
    user_id: user.id,
    website_url: data.websiteUrl,
    product_name: data.productName,
    product_description: data.productDescription,
    competitors,
    target_keywords: data.targetKeywords,
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .insert(productPayload)
    .select("id")
    .single()

  if (productError || !product) {
    console.error("Failed to save preview product:", productError)
    return {
      ok: false,
      message: "We couldn't save your setup. Please try again.",
    }
  }

  const { data: preview, error: previewError } = await supabaseAdmin
    .from("onboarding_previews")
    .insert({
      user_id: user.id,
      product_id: product.id,
      website_domain: websiteDomain,
      status: "pending",
    })
    .select("id")
    .single()

  if (previewError || !preview) {
    // A concurrent request may have won the unique account/domain insert.
    const { data: racedPreview } = await supabaseAdmin
      .from("onboarding_previews")
      .select("id")
      .eq("user_id", user.id)
      .eq("website_domain", websiteDomain)
      .maybeSingle()
    if (racedPreview) {
      await supabaseAdmin
        .from("products")
        .delete()
        .eq("id", product.id)
        .eq("user_id", user.id)
      return { ok: true, previewId: racedPreview.id }
    }

    console.error("Failed to create onboarding preview:", previewError)
    await supabaseAdmin
      .from("products")
      .delete()
      .eq("id", product.id)
      .eq("user_id", user.id)
    return {
      ok: false,
      message: "We couldn't request your preview. Please try again.",
    }
  }

  await Promise.all([
    supabaseAdmin
      .from("profiles")
      .update({ name: data.userName || null })
      .eq("id", user.id),
    supabaseAdmin.from("backlink_prospects_settings").upsert(
      {
        product_id: product.id,
        opportunity_types: DEFAULT_PROSPECT_TIERS,
        ...DEFAULT_DISCOVERY_SETTINGS,
      },
      { onConflict: "product_id" }
    ),
    data.importantPages.length > 0
      ? supabaseAdmin.from("product_pages").upsert(
          data.importantPages.map((url, index) => ({
            product_id: product.id,
            url,
            page_type: "manual" as const,
            priority: index + 1,
            is_manual: true,
            is_target: true,
            crawl_status: "pending" as const,
          })),
          { onConflict: "product_id,url" }
        )
      : Promise.resolve(),
  ])

  try {
    await startPreviewJobs({
      userId: user.id,
      productId: product.id,
      previewId: preview.id,
      crawlLimit: FREE_TRIAL_MAX_PAGES,
      autoDiscoverPages: data.autoDiscoverPages,
    })
  } catch (error) {
    await supabaseAdmin
      .from("onboarding_previews")
      .update({ status: "failed", failure_reason: String(error).slice(0, 500) })
      .eq("id", preview.id)
  }

  return { ok: true, previewId: preview.id }
}
