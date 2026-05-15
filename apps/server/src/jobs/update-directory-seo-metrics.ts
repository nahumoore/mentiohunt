import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"

const ACTOR_ID = "kinaesthetic_millionaire~ahref-website-authority-checker"
const BATCH_SIZE = 10

type ApifyResult = {
  url?: string
  normalized_url?: string
  domainRating?: number | string | null
  backlinks?: number | string | null
  refdomains?: number | string | null
  dofollowBacklinks?: number | string | null
  dofollowRefdomains?: number | string | null
  error?: string
}

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

function toActorUrl(domain: string): string {
  return `https://${normalizeDomain(domain)}`
}

function toNumber(value: number | string | null | undefined): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null
  if (typeof value !== "string") return null

  const parsed = Number.parseFloat(value.replace(/,/g, ""))
  return Number.isFinite(parsed) ? parsed : null
}

async function fetchAhrefsMetrics(domains: string[]): Promise<ApifyResult[]> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}&timeout=300`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      start_urls: domains.map((domain) => ({ url: toActorUrl(domain) })),
    }),
    signal: AbortSignal.timeout(360_000),
  })

  if (!res.ok) throw new Error(`Apify ${res.status}: ${res.statusText}`)
  return res.json() as Promise<ApifyResult[]>
}

export async function updateDirectorySeoMetrics(): Promise<void> {
  if (!process.env.APIFY_TOKEN) {
    console.error("[seo-metrics] APIFY_TOKEN not set, skipping")
    return
  }

  console.log("[seo-metrics] Starting monthly directory SEO metrics update")

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
  const limit = pLimit(2)
  let updated = 0
  let failed = 0

  await Promise.all(
    batches.map((batch) =>
      limit(async () => {
        const domains = batch.map((d) => d.domain)
        let results: ApifyResult[]

        try {
          results = await fetchAhrefsMetrics(domains)
        } catch (err) {
          console.error(
            `[seo-metrics] Apify failed for [${domains.join(", ")}]:`,
            err
          )
          failed += batch.length
          return
        }

        const byDomain = new Map(
          results.map((r) => [
            normalizeDomain(r.normalized_url ?? r.url ?? ""),
            r,
          ])
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
      })
    )
  )

  console.log(`[seo-metrics] Done — updated=${updated} failed=${failed}`)
}
