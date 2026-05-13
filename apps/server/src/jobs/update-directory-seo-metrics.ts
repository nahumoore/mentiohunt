import pLimit from "p-limit"
import { supabaseAdmin } from "@workspace/supabase/admin"

const ACTOR_ID = "seo-scraper~moz-domain-authority-checker"
const BATCH_SIZE = 10

type ApifyResult = {
  domain?: string
  domain_authority?: number
  spam_score?: number
  linking_root_domains?: number
  ranking_keywords?: number
  top_pages_by_links?: unknown
  top_linking_domains?: unknown
  discovered_and_lost_linking_domains?: unknown
  keywords_by_estimated_clicks?: unknown
  top_ranking_keywords?: unknown
  branded_keywords?: unknown
  keyword_ranking_distribution?: unknown
  top_search_competitors?: unknown
  top_questions?: unknown
  success?: boolean
  error?: string
}

function normalizeDomain(raw: string): string {
  return raw.replace(/^https?:\/\//, "").replace(/\/$/, "").toLowerCase()
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function fetchMozMetrics(domains: string[]): Promise<ApifyResult[]> {
  const token = process.env.APIFY_TOKEN
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${token}&timeout=300`

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ domains }),
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
          results = await fetchMozMetrics(domains)
        } catch (err) {
          console.error(`[seo-metrics] Apify failed for [${domains.join(", ")}]:`, err)
          failed += batch.length
          return
        }

        const byDomain = new Map(
          results.map((r) => [normalizeDomain(r.domain ?? ""), r])
        )

        for (const dir of batch) {
          const r = byDomain.get(normalizeDomain(dir.domain))
          if (!r || r.success === false) {
            console.warn(`[seo-metrics] No result for ${dir.domain}`)
            failed++
            continue
          }

          const { error: updateError } = await supabaseAdmin
            .from("directories")
            .update({
              domain_authority: r.domain_authority ?? null,
              spam_score: r.spam_score ?? null,
              linking_root_domains: r.linking_root_domains ?? null,
              ranking_keywords: r.ranking_keywords ?? null,
              seo_metrics_updated_at: new Date().toISOString(),
              seo_metrics_details: {
                top_pages_by_links: r.top_pages_by_links,
                top_linking_domains: r.top_linking_domains,
                discovered_and_lost_linking_domains: r.discovered_and_lost_linking_domains,
                keywords_by_estimated_clicks: r.keywords_by_estimated_clicks,
                top_ranking_keywords: r.top_ranking_keywords,
                branded_keywords: r.branded_keywords,
                keyword_ranking_distribution: r.keyword_ranking_distribution,
                top_search_competitors: r.top_search_competitors,
                top_questions: r.top_questions,
              },
            })
            .eq("id", dir.id)

          if (updateError) {
            console.error(`[seo-metrics] DB update failed for ${dir.domain}:`, updateError.message)
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
