import { supabaseAdmin } from "@workspace/supabase/admin"
import { AHREFS_AUTHORITY_CHECKER, type AhrefsAuthorityResult } from "../actors/ahrefs-authority-checker.js"

const BATCH_SIZE = 25

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

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string") return null

  const parsed = Number.parseFloat(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

async function fetchAhrefsMetrics(domains: string[]): Promise<AhrefsAuthorityResult[]> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${AHREFS_AUTHORITY_CHECKER}/run-sync-get-dataset-items?token=${token}&timeout=300`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_urls: domains.map((domain) => ({
        url: `https://${normalizeDomain(domain)}`,
      })),
    }),
    signal: AbortSignal.timeout(360_000),
  })

  if (!res.ok) throw new Error(`Apify ${res.status}: ${res.statusText}`)
  return res.json() as Promise<AhrefsAuthorityResult[]>
}

export async function updateMissingDirectorySeoMetrics(): Promise<void> {
  if (!process.env.APIFY_TOKEN) {
    console.error("[seo-metrics] APIFY_TOKEN not set, skipping")
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

  console.log(`[seo-metrics] Found ${directories.length} directories with missing metrics`)

  const batches = chunk(directories, BATCH_SIZE)
  let updated = 0
  let failed = 0

  for (const [i, batch] of batches.entries()) {
    const domains = batch.map((d) => d.domain)
    console.log(
      `[seo-metrics] Batch ${i + 1}/${batches.length} (${domains.length} domains)`
    )

    let results: AhrefsAuthorityResult[]
    try {
      results = await fetchAhrefsMetrics(domains)
    } catch (err) {
      console.error(`[seo-metrics] Apify failed for batch ${i + 1}:`, err)
      failed += batch.length
      continue
    }

    const byDomain = new Map(
      results.map((r) => [normalizeDomain(r.normalized_url ?? r.url ?? ""), r])
    )

    for (const dir of batch) {
      const r = byDomain.get(normalizeDomain(dir.domain))
      if (!r || r.error) {
        console.warn(`[seo-metrics] No result for ${dir.domain}`)
        failed++
        continue
      }

      const { error: updateError } = await supabaseAdmin
        .from("directories")
        .update({
          domain_rating: toNumber(r.domainRating),
          backlinks: toNumber(r.backlinks),
          referring_domains: toNumber(r.refdomains),
          dofollow_backlinks: toNumber(r.dofollowBacklinks),
          dofollow_referring_domains: toNumber(r.dofollowRefdomains),
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
  if (!process.env.APIFY_TOKEN) {
    console.error("[seo-metrics] APIFY_TOKEN not set, skipping")
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

  for (const [i, batch] of batches.entries()) {
    const domains = batch.map((d) => d.domain)
    console.log(
      `[seo-metrics] Batch ${i + 1}/${batches.length} (${domains.length} domains)`
    )

    let results: AhrefsAuthorityResult[]
    try {
      results = await fetchAhrefsMetrics(domains)
    } catch (err) {
      console.error(`[seo-metrics] Apify failed for batch ${i + 1}:`, err)
      failed += batch.length
      continue
    }

    const byDomain = new Map(
      results.map((r) => [normalizeDomain(r.normalized_url ?? r.url ?? ""), r])
    )

    for (const dir of batch) {
      const r = byDomain.get(normalizeDomain(dir.domain))
      if (!r || r.error) {
        console.warn(`[seo-metrics] No result for ${dir.domain}`)
        failed++
        continue
      }

      const { error: updateError } = await supabaseAdmin
        .from("directories")
        .update({
          domain_rating: toNumber(r.domainRating),
          backlinks: toNumber(r.backlinks),
          referring_domains: toNumber(r.refdomains),
          dofollow_backlinks: toNumber(r.dofollowBacklinks),
          dofollow_referring_domains: toNumber(r.dofollowRefdomains),
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
