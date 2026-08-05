import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../helpers/logger.js"
import { checkTrackedLink, type CheckTrackedLinkProduct } from "../methods/link-tracker/check-tracked-link.js"
import type { TrackedLinkRow } from "../methods/link-tracker/types.js"

const log = createLogger("daily-link-tracker")

// Selected in `next_check_at` order and capped per run — a busier-than-budget
// day just rolls the overflow into the next scheduled run automatically,
// no extra bookkeeping needed.
const RUN_BUDGET = Number(process.env.LINK_TRACKER_RUN_BUDGET ?? 500)
const PRODUCT_CONCURRENCY = 5

export type LinkTrackerMode = "sweep" | "confirm"

/**
 * Link tracker's nightly re-check. Two modes, run from separate cron slots
 * (see jobs/index.ts):
 *  - "sweep" (03:30 UTC): every due tracked link, normal tiered fetch.
 *  - "confirm" (15:30 UTC): only links left in an unconfirmed single-miss or
 *    single/double-failure state by the morning sweep, re-fetched with
 *    force_dynamic so a JS-rendered link list gets a fair second look before
 *    the 17:00 digest goes out — this is what lets a genuine removal reach
 *    the user the same day without requiring two full 24h-apart checks.
 */
export async function runDailyLinkTracker(options?: {
  mode?: LinkTrackerMode
  /** Dev/testing convenience: scope the sweep to one product instead of every due link. */
  productId?: string
  /** Dev/testing convenience: bypass the paid-tier gate (still requires the product/profile to exist). */
  skipEligibilityCheck?: boolean
}): Promise<void> {
  const mode = options?.mode ?? "sweep"
  log.info("starting", { mode, productId: options?.productId, skipEligibilityCheck: !!options?.skipEligibilityCheck })

  let query = supabaseAdmin
    .from("tracked_links" as string)
    .select("*")
    .lte("next_check_at", new Date().toISOString())
    .order("next_check_at", { ascending: true })
    .limit(RUN_BUDGET)

  if (mode === "confirm") {
    query = query.or("consecutive_missing.eq.1,and(consecutive_failures.gte.1,consecutive_failures.lte.2)")
  }

  if (options?.productId) {
    query = query.eq("product_id", options.productId)
  }

  const { data: dueLinks, error } = await query

  if (error) {
    log.error("failed to load due tracked links", { mode, error: error.message })
    return
  }

  const links = (dueLinks ?? []) as unknown as TrackedLinkRow[]
  if (links.length === 0) {
    log.info("no due links", { mode })
    return
  }

  const productIds = [...new Set(links.map((l) => l.product_id))]
  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, website_url, competitors")
    .in("id", productIds)

  if (productsError) {
    log.error("failed to load products", { error: productsError.message })
    return
  }

  const userIds = [...new Set((products ?? []).map((p) => p.user_id))]
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, tier")
    .in("id", userIds)

  if (profilesError) {
    log.error("failed to load profiles", { error: profilesError.message })
    return
  }

  const tierByUserId = new Map((profiles ?? []).map((p) => [p.id, p.tier]))
  const productById = new Map(
    (products ?? []).map((p) => [
      p.id,
      { website_url: p.website_url, competitors: (p.competitors as string[] | null) ?? null } satisfies CheckTrackedLinkProduct,
    ])
  )
  const ownerByProductId = new Map((products ?? []).map((p) => [p.id, p.user_id]))

  // Paid tiers only — active_trial deliberately ignored, matching the hard
  // gate at submission time (apps/web/app/api/link-tracker/route.ts).
  // Downgraded users' links just stop being checked, they aren't deleted.
  const eligibleLinks = links.filter((link) => {
    if (options?.skipEligibilityCheck) return true
    const userId = ownerByProductId.get(link.product_id)
    const tier = userId ? tierByUserId.get(userId) : undefined
    return tier === "pro" || tier === "agency"
  })

  log.info("links to process", { mode, total: links.length, eligible: eligibleLinks.length })

  const linksByProduct = new Map<string, TrackedLinkRow[]>()
  for (const link of eligibleLinks) {
    const list = linksByProduct.get(link.product_id) ?? []
    list.push(link)
    linksByProduct.set(link.product_id, list)
  }

  const productLimit = pLimit(PRODUCT_CONCURRENCY)
  await Promise.allSettled(
    [...linksByProduct.entries()].map(([productId, productLinks]) =>
      productLimit(async () => {
        const product = productById.get(productId)
        if (!product) return
        await processProductLinks(productId, productLinks, product, mode)
      })
    )
  )

  log.info("complete", { mode })
}

async function processProductLinks(
  productId: string,
  links: TrackedLinkRow[],
  product: CheckTrackedLinkProduct,
  mode: LinkTrackerMode
): Promise<void> {
  // A single product can have dozens of tracked links on the same blog —
  // serializing per source_domain prevents the sweep from tripping rate
  // limits (and manufacturing its own "check_failed" outcomes) on that host.
  const domainLimits = new Map<string, ReturnType<typeof pLimit>>()
  const limitFor = (domain: string) => {
    let limit = domainLimits.get(domain)
    if (!limit) {
      limit = pLimit(1)
      domainLimits.set(domain, limit)
    }
    return limit
  }

  await Promise.allSettled(
    links.map((link) =>
      limitFor(link.source_domain)(async () => {
        try {
          await checkTrackedLink(link, product, { forceDynamic: mode === "confirm" })
        } catch (err) {
          log.error("check failed", { trackedLinkId: link.id, productId, error: String(err) })
        }
      })
    )
  )
}
