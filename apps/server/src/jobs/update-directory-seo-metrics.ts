import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { getDomainRating } from "../helpers/ahrefs/get-domain-rating.js"
import { getBacklinksSummary } from "../helpers/data-for-seo/get-backlinks-summary.js"

const BATCH_SIZE = 25
const FETCH_CONCURRENCY = 5

function normalizeDomain(raw: string): string {
  const withProtocol = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`

  try {
    return new URL(withProtocol).hostname.replace(/^www\./i, "").toLowerCase()
  } catch {
    return raw
      .replace(/^https?:\/\//i, "")
      .replace(/^www\./i, "")
      .replace(/\/.*$/, "")
      .toLowerCase()
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

function hasDataForSeoCredentials(): boolean {
  return !!process.env.DATAFORSEO_LOGIN && !!process.env.DATAFORSEO_PASSWORD
}

async function fetchDirectorySeoMetrics(domain: string): Promise<{
  domainRating: number | null
  backlinks: number | null
  referringDomains: number | null
  dofollowBacklinks: number | null
  dofollowReferringDomains: number | null
}> {
  const normalizedDomain = normalizeDomain(domain)
  const [domainRating, summary, dofollowSummary] = await Promise.all([
    getDomainRating(normalizedDomain),
    getBacklinksSummary(normalizedDomain),
    getBacklinksSummary(normalizedDomain, { dofollowOnly: true }),
  ])

  return {
    domainRating,
    backlinks: summary.backlinks,
    referringDomains: summary.referringDomains,
    dofollowBacklinks: dofollowSummary.backlinks,
    dofollowReferringDomains: dofollowSummary.referringDomains,
  }
}

export async function updateMissingDirectorySeoMetrics(): Promise<void> {
  if (!hasDataForSeoCredentials()) {
    console.error("[seo-metrics] DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD not set, skipping")
    return
  }

  console.log("[seo-metrics] Starting missing SEO metrics population")

  const { data: directories, error } = await supabaseAdmin
    .from("directories")
    .select("id, domain")
    .eq("is_active", true)
    .is("seo_metrics_updated_at", null)

  if (error) {
    console.error("[seo-metrics] Failed to fetch directories:", error.message)
    return
  }

  if (!directories?.length) {
    console.log("[seo-metrics] No directories with missing SEO metrics")
    return
  }

  console.log(
    `[seo-metrics] Found ${directories.length} directories with missing metrics`
  )

  const batches = chunk(directories, BATCH_SIZE)
  let updated = 0
  let failed = 0
  const limit = pLimit(FETCH_CONCURRENCY)

  for (const [i, batch] of batches.entries()) {
    console.log(
      `[seo-metrics] Batch ${i + 1}/${batches.length} (${batch.length} domains)`
    )

    const results = await Promise.allSettled(
      batch.map((dir) =>
        limit(async () => ({
          dir,
          metrics: await fetchDirectorySeoMetrics(dir.domain),
        }))
      )
    )

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`[seo-metrics] Metrics fetch failed for batch ${i + 1}:`, result.reason)
        failed++
        continue
      }

      const { dir, metrics } = result.value

      const { error: updateError } = await supabaseAdmin
        .from("directories")
        .update({
          domain_rating: metrics.domainRating,
          backlinks: metrics.backlinks,
          referring_domains: metrics.referringDomains,
          dofollow_backlinks: metrics.dofollowBacklinks,
          dofollow_referring_domains: metrics.dofollowReferringDomains,
          seo_metrics_updated_at: new Date().toISOString(),
        })
        .eq("id", dir.id)

      if (updateError) {
        console.error(
          `[seo-metrics] DB update failed for ${dir.domain}:`,
          updateError.message
        )
        failed++
      } else {
        updated++
      }
    }
  }

  console.log(`[seo-metrics] Done — updated=${updated} failed=${failed}`)
}

export async function updateDirectorySeoMetrics(): Promise<void> {
  if (!hasDataForSeoCredentials()) {
    console.error("[seo-metrics] DATAFORSEO_LOGIN/DATAFORSEO_PASSWORD not set, skipping")
    return
  }

  console.log("[seo-metrics] Starting directory SEO metrics update")

  const { data: directories, error } = await supabaseAdmin
    .from("directories")
    .select("id, domain")
    .eq("is_active", true)

  if (error) {
    console.error("[seo-metrics] Failed to fetch directories:", error.message)
    return
  }

  if (!directories?.length) {
    console.log("[seo-metrics] No active directories")
    return
  }

  const batches = chunk(directories, BATCH_SIZE)
  let updated = 0
  let failed = 0
  const limit = pLimit(FETCH_CONCURRENCY)

  for (const [i, batch] of batches.entries()) {
    console.log(
      `[seo-metrics] Batch ${i + 1}/${batches.length} (${batch.length} domains)`
    )

    const results = await Promise.allSettled(
      batch.map((dir) =>
        limit(async () => ({
          dir,
          metrics: await fetchDirectorySeoMetrics(dir.domain),
        }))
      )
    )

    for (const result of results) {
      if (result.status === "rejected") {
        console.error(`[seo-metrics] Metrics fetch failed for batch ${i + 1}:`, result.reason)
        failed++
        continue
      }

      const { dir, metrics } = result.value

      const { error: updateError } = await supabaseAdmin
        .from("directories")
        .update({
          domain_rating: metrics.domainRating,
          backlinks: metrics.backlinks,
          referring_domains: metrics.referringDomains,
          dofollow_backlinks: metrics.dofollowBacklinks,
          dofollow_referring_domains: metrics.dofollowReferringDomains,
          seo_metrics_updated_at: new Date().toISOString(),
        })
        .eq("id", dir.id)

      if (updateError) {
        console.error(
          `[seo-metrics] DB update failed for ${dir.domain}:`,
          updateError.message
        )
        failed++
      } else {
        updated++
      }
    }
  }

  console.log(`[seo-metrics] Done — updated=${updated} failed=${failed}`)
}
