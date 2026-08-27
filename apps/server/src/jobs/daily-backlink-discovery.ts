import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { sendBrokenLinkAlertEmail } from "../helpers/emails/send-broken-link-alert.js"
import { sendCompetitorBacklinkAlertEmail } from "../helpers/emails/send-competitor-backlink-alert.js"
import { sendListicleAlertEmail } from "../helpers/emails/send-listicle-alert.js"
import { sendResourcePageInclusionAlertEmail } from "../helpers/emails/send-resource-page-inclusion-alert.js"
import { sendUnlinkedMentionAlertEmail } from "../helpers/emails/send-unlinked-mention-alert.js"
import { createLogger } from "../helpers/logger.js"
import { discoverBrokenLinkBuilding } from "../methods/prospect-generation-methods/broken-link-building/index.js"
import { discoverCompetitorBacklinks } from "../methods/prospect-generation-methods/competitor-backlink/index.js"
import type { FilterSettings } from "../methods/prospect-generation-methods/competitor-backlink/filter-backlinks.js"
import { extractCompetitorDomain, isBlockedCompetitorDomain } from "../methods/prospect-generation-methods/competitor-backlink/extract-backlinks.js"
import { discoverListicleRoundups } from "../methods/prospect-generation-methods/listicle-roundup/index.js"
import { discoverResourcePageInclusions } from "../methods/prospect-generation-methods/resource-page-inclusion/index.js"
import { discoverUnlinkedMentions } from "../methods/prospect-generation-methods/unlinked-mention/index.js"
import { crawlProductPages, type CrawlProductPagesResult } from "../methods/product-pages/crawl-product-pages.js"
import { ALL_OPPORTUNITY_TYPES } from "../methods/prospect-generation-methods/shared/opportunity-types.js"
import type { EmailSettings, ProspectCreatedPayload } from "../methods/prospect-generation-methods/shared/prospect-types.js"
import {
  getStrategyCooldownRuns,
  isStrategyCoolingDown,
  orderStrategiesByEfficiency,
  orderStrategiesByStaleness,
  type RotationHistoryRun,
} from "../methods/prospect-generation-methods/shared/strategy-rotation.js"
import { assignSequences, createSequencesForProspect } from "../processes/onboarding/prospect-sequences.js"
import { resolveEmailAccount } from "../processes/onboarding/resolve-email-account.js"

const log = createLogger("daily-backlink-discovery")

const PRODUCT_CONCURRENCY = 5

export type RotationStrategy =
  | "competitor_backlink"
  | "unlinked_mention"
  | "listicle_roundup"
  | "resource_page_inclusion"
  | "broken_link_building"

const ROTATION_STRATEGIES: RotationStrategy[] = [
  "competitor_backlink",
  "unlinked_mention",
  "listicle_roundup",
  "resource_page_inclusion",
  "broken_link_building",
]

export type DiscoveryProduct = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  competitors: string[] | null
  target_keywords: string[] | null
}

type DiscoveryResult = { prospectsCreated: number; totalCostUsd: number }
type StrategyRunOptions = {
  adaptive: boolean
  budget?: { remaining: number }
  targetRemaining?: number
  shouldStop?: () => boolean
}

type StrategyHandler = {
  /** Cheap precondition — a strategy that can only no-op shouldn't consume the product's daily slot. */
  isRunnable: (product: DiscoveryProduct, adaptive?: boolean) => Promise<boolean> | boolean
  discover: (
    product: DiscoveryProduct,
    filterSettings: FilterSettings,
    emailSettings: EmailSettings,
    onProspectCreated?: (p: ProspectCreatedPayload) => void,
    options?: StrategyRunOptions
  ) => Promise<DiscoveryResult>
  sendAlert: (args: {
    to: string
    userId: string
    userName: string | null
    productName: string
    prospectsCreated: number
  }) => Promise<void>
}

const STRATEGY_HANDLERS: Record<RotationStrategy, StrategyHandler> = {
  competitor_backlink: {
    isRunnable: (product, adaptive) =>
      adaptive || (product.competitors ?? []).some((competitor) => {
        const domain = extractCompetitorDomain(competitor)
        return Boolean(domain) && !isBlockedCompetitorDomain(domain)
      }),
    discover: (product, filterSettings, emailSettings, onProspectCreated, options) =>
      discoverCompetitorBacklinks(
        { ...product, competitors: product.competitors ?? [] },
        filterSettings,
        emailSettings,
        options?.adaptive
          ? {
              maxCompetitors: 5,
              maxProspects: Math.min(options.budget?.remaining ?? 20, options.targetRemaining ?? 10),
              includeIntersection: true,
              refreshCompetitors: true,
              shouldStop: options.shouldStop,
            }
          : {},
        options?.budget,
        onProspectCreated
      ),
    sendAlert: sendCompetitorBacklinkAlertEmail,
  },
  unlinked_mention: {
    isRunnable: (product) => (product.product_name?.trim() ?? "") !== "",
    discover: (product, filterSettings, emailSettings, onProspectCreated, options) =>
      discoverUnlinkedMentions(
        product,
        filterSettings,
        emailSettings,
        options?.adaptive ? { maxCandidates: 50, maxProspects: options.budget?.remaining } : {},
        options?.budget,
        onProspectCreated
      ),
    sendAlert: sendUnlinkedMentionAlertEmail,
  },
  listicle_roundup: {
    isRunnable: (product) => (product.product_name?.trim() ?? "") !== "",
    discover: (product, filterSettings, emailSettings, onProspectCreated, options) =>
      discoverListicleRoundups(
        product,
        filterSettings,
        emailSettings,
        options?.adaptive ? { maxCandidates: 50, maxProspects: options.budget?.remaining } : {},
        options?.budget,
        onProspectCreated
      ),
    sendAlert: sendListicleAlertEmail,
  },
  resource_page_inclusion: {
    isRunnable: async (product) => {
      const { count } = await supabaseAdmin
        .from("product_pages")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("crawl_status", "crawled")
        .eq("is_target", true)
      return (count ?? 0) > 0
    },
    discover: async (product, filterSettings, emailSettings, onProspectCreated, options) => {
      const { prospectsCreated, totalCostUsd } = await discoverResourcePageInclusions(
        product,
        filterSettings,
        emailSettings,
        options?.adaptive
          ? { maxCandidates: 50, maxProspects: options.budget?.remaining }
          : {},
        options?.budget,
        onProspectCreated
      )
      return { prospectsCreated, totalCostUsd }
    },
    sendAlert: sendResourcePageInclusionAlertEmail,
  },
  broken_link_building: {
    isRunnable: async (product) => {
      const hasUsableCompetitor = (product.competitors ?? []).some((competitor) => {
        const domain = extractCompetitorDomain(competitor)
        return Boolean(domain) && !isBlockedCompetitorDomain(domain)
      })
      if (!hasUsableCompetitor) return false
      const { count } = await supabaseAdmin
        .from("product_pages")
        .select("id", { count: "exact", head: true })
        .eq("product_id", product.id)
        .eq("crawl_status", "crawled")
        .eq("is_target", true)
        // Mirrors ELIGIBLE_PAGE_TYPES in broken-link-building/index.ts —
        // "manual" included so a product whose only target pages are
        // user-picked onboarding pages still makes this method runnable.
        .in("page_type", ["article", "resource", "free_tool", "manual"])
      return (count ?? 0) > 0
    },
    discover: (product, filterSettings, emailSettings, onProspectCreated, options) =>
      discoverBrokenLinkBuilding(
        { ...product, competitors: product.competitors ?? [] },
        filterSettings,
        emailSettings,
        options?.adaptive ? { maxCompetitors: 3, maxProspects: options.budget?.remaining } : {},
        options?.budget,
        onProspectCreated
      ),
    sendAlert: sendBrokenLinkAlertEmail,
  },
}

/**
 * Pick the least-recently-started enabled strategy whose precondition passes.
 * Failed and still-running runs count as "ran" so an erroring strategy goes to
 * the back of the queue instead of being retried every day. Clean zero-yield
 * streaks receive a short cooldown, while partial/failed runs remain eligible
 * for a normal retry after the other strategies have had their turn.
 */
async function selectStrategyForRun(
  product: DiscoveryProduct,
  enabled: RotationStrategy[]
): Promise<RotationStrategy | null> {
  const { data: runs, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("strategy, started_at, status, prospects_created, metadata, error")
    .eq("product_id", product.id)
    .in("strategy", enabled)
    .order("started_at", { ascending: false })
    .limit(100)

  if (error) {
    log.warn("failed to load run history for rotation", { productId: product.id, error: error.message })
  }

  const history = (runs ?? []) as RotationHistoryRun[]
  const byStaleness = orderStrategiesByStaleness(enabled, history)

  for (const strategy of byStaleness) {
    const cooldownRuns = getStrategyCooldownRuns(history, strategy)
    if (cooldownRuns > 0) {
      log.info("strategy cooling down after clean zero-yield streak", {
        productId: product.id,
        strategy,
        remainingProductRuns: cooldownRuns,
      })
      continue
    }

    if (await STRATEGY_HANDLERS[strategy].isRunnable(product, false)) return strategy
    log.info("strategy not runnable, trying next", { productId: product.id, strategy })
  }

  return null
}

async function loadStrategyHistory(
  productId: string,
  enabled: RotationStrategy[]
): Promise<RotationHistoryRun[]> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .select("strategy, started_at, status, prospects_created, cost_usd, metadata, error")
    .eq("product_id", productId)
    .in("strategy", enabled)
    .order("started_at", { ascending: false })
    .limit(100)

  if (error) {
    log.warn("failed to load adaptive run history", { productId, error: error.message })
    return []
  }

  return (data ?? []) as RotationHistoryRun[]
}

function metadataNumber(metadata: unknown, key: string): number {
  if (metadata === null || typeof metadata !== "object" || Array.isArray(metadata)) return 0
  const value = (metadata as Record<string, unknown>)[key]
  return typeof value === "number" && Number.isFinite(value) ? value : 0
}

function shouldExploreUnlinkedMentions(history: RotationHistoryRun[]): boolean {
  const completed = history
    .filter((run) => run.strategy === "unlinked_mention" && run.status === "completed")
    .slice(0, 3)
  if (completed.length === 0) return true
  return completed.some((run) => metadataNumber(run.metadata, "candidates_gathered") >= 5)
}

function isBrokenLinkRunDue(history: RotationHistoryRun[], now = new Date()): boolean {
  const latest = history.find((run) => run.strategy === "broken_link_building")
  if (!latest?.started_at) return true
  return now.getTime() - new Date(latest.started_at).getTime() >= 7 * 24 * 60 * 60 * 1_000
}

async function buildAdaptiveStrategyQueue(
  product: DiscoveryProduct,
  enabled: RotationStrategy[],
  history: RotationHistoryRun[]
): Promise<RotationStrategy[]> {
  const orderedRemainder = orderStrategiesByEfficiency(
    enabled.filter((strategy) => strategy !== "competitor_backlink"),
    history
  )
  const preferred: RotationStrategy[] = enabled.includes("competitor_backlink")
    ? ["competitor_backlink", ...orderedRemainder]
    : orderedRemainder
  const runnable: RotationStrategy[] = []

  for (const strategy of preferred) {
    if (isStrategyCoolingDown(history, strategy)) {
      log.info("adaptive source cooling down", { productId: product.id, strategy })
      continue
    }
    if (strategy === "unlinked_mention" && !shouldExploreUnlinkedMentions(history)) {
      log.info("adaptive source skipped: no demonstrated branded-search volume", {
        productId: product.id,
        strategy,
      })
      continue
    }
    if (strategy === "broken_link_building" && !isBrokenLinkRunDue(history)) {
      log.info("adaptive source skipped: weekly scan not due", { productId: product.id, strategy })
      continue
    }
    if (!(await STRATEGY_HANDLERS[strategy].isRunnable(product, true))) {
      log.info("adaptive source not runnable", { productId: product.id, strategy })
      continue
    }
    runnable.push(strategy)
  }

  return runnable
}

async function ensureProductReadiness(product: DiscoveryProduct): Promise<string[]> {
  const validCompetitors = (product.competitors ?? [])
    .map(extractCompetitorDomain)
    .filter((domain) => domain && !isBlockedCompetitorDomain(domain))
  const reasons: string[] = []

  const getCrawledTargetCount = async () => {
    const { count, error } = await supabaseAdmin
      .from("product_pages")
      .select("id", { count: "exact", head: true })
      .eq("product_id", product.id)
      .eq("crawl_status", "crawled")
      .eq("is_target", true)
    if (error) {
      log.warn("readiness target-page check failed", { productId: product.id, error: error.message })
      return 0
    }
    return count ?? 0
  }

  // Recorded even on a zero-result attempt so a silent crawl failure (no
  // sitemap candidates, or every candidate fetch failing) leaves a visible
  // trace in discovery_status instead of just an empty product_pages table.
  let lastCrawlRetry:
    | (CrawlProductPagesResult & { attemptedAt: string })
    | { error: string; attemptedAt: string }
    | undefined

  let crawledTargets = await getCrawledTargetCount()
  if (crawledTargets === 0) {
    const attemptedAt = new Date().toISOString()
    try {
      const retry = await crawlProductPages(product.id, { crawlLimit: 50 })
      log.info("automatic target-page readiness retry complete", { productId: product.id, ...retry })
      lastCrawlRetry = { ...retry, attemptedAt }
      crawledTargets = await getCrawledTargetCount()
    } catch (error) {
      log.warn("automatic target-page readiness retry failed", { productId: product.id, error: String(error) })
      lastCrawlRetry = { error: String(error), attemptedAt }
    }
  }

  if (crawledTargets === 0) reasons.push("no_crawled_target_pages")
  if ((product.target_keywords ?? []).length === 0) reasons.push("no_target_keywords")
  if (validCompetitors.length < 3) reasons.push("fewer_than_three_configured_competitors")

  const { error: statusError } = await supabaseAdmin.rpc("merge_discovery_status", {
    p_product_id: product.id,
    p_updates: {
      daily_readiness: {
        checked_at: new Date().toISOString(),
        ready: reasons.length === 0,
        reasons,
        crawled_target_pages: crawledTargets,
        valid_competitors: validCompetitors.length,
        target_keywords: (product.target_keywords ?? []).length,
        ...(lastCrawlRetry ? { last_crawl_retry: lastCrawlRetry } : {}),
      },
    },
  })
  if (statusError) {
    log.warn("failed to persist discovery readiness", { productId: product.id, error: statusError.message })
  }

  return reasons
}

export async function runDiscoveryForProduct(
  product: DiscoveryProduct,
  profile: { email: string | null; name: string | null } | undefined
): Promise<{
  strategy: RotationStrategy | null
  strategies: RotationStrategy[]
  prospectsCreated: number
  sendReadyCreated: number
  totalCostUsd: number
  emailSent: boolean
  readinessReasons?: string[]
  stopReason?: "target_reached" | "candidate_cap_reached" | "cost_cap_reached" | "sources_exhausted"
  skipped?: string
}> {
  const { data: settings } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select(
      "dr_min, dr_max, voice_tone, offering, opportunity_types, adaptive_discovery_enabled, daily_discovery_target, daily_discovery_candidate_cap, daily_discovery_cost_cap_usd"
    )
    .eq("product_id", product.id)
    .single()

  const opportunityTypes = settings?.opportunity_types ?? ALL_OPPORTUNITY_TYPES
  const enabled = ROTATION_STRATEGIES.filter((s) => opportunityTypes.includes(s))

  if (enabled.length === 0) {
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      skipped: "no rotation strategies enabled",
    }
  }

  const adaptive = settings?.adaptive_discovery_enabled === true
  // Runs for every product, not just adaptive ones — a non-adaptive product
  // with zero crawled target pages would otherwise never get an automatic
  // crawl retry, permanently blocking resource_page_inclusion and
  // broken_link_building from ever producing a run.
  const readinessReasons = await ensureProductReadiness(product)
  const history = adaptive ? await loadStrategyHistory(product.id, enabled) : []
  const strategies = adaptive
    ? await buildAdaptiveStrategyQueue(product, enabled, history)
    : [await selectStrategyForRun(product, enabled)].filter((value): value is RotationStrategy => value !== null)

  if (strategies.length === 0) {
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      readinessReasons,
      skipped: "no runnable strategy (missing competitors / crawled pages)",
    }
  }

  const filterSettings = {
    dr_min: settings?.dr_min ?? 0,
    dr_max: settings?.dr_max ?? null,
  }

  const emailSettings = {
    voice_tone: settings?.voice_tone ?? null,
    offering: settings?.offering ?? null,
  }

  const dailyTarget = Math.max(1, settings?.daily_discovery_target ?? 10)
  const candidateCap = Math.max(dailyTarget, settings?.daily_discovery_candidate_cap ?? 15)
  const costCapUsd = Math.max(0.01, settings?.daily_discovery_cost_cap_usd ?? 0.7)
  const budget = adaptive ? { remaining: candidateCap } : undefined

  log.info("discovery sources selected", {
    productId: product.id,
    adaptive,
    strategies,
    dailyTarget: adaptive ? dailyTarget : undefined,
    candidateCap: adaptive ? candidateCap : undefined,
    costCapUsd: adaptive ? costCapUsd : undefined,
    readinessReasons,
  })

  // Resolve the sending account once so newly-created prospects get their sequence
  // rows written in-flight with the LLM-generated step2/step3 bodies, the same way
  // onboarding does (run-onboarding-jobs.ts) — otherwise the safety-net sweep below
  // can't see them and always falls back to the templated follow-up.
  const account = await resolveEmailAccount(product.user_id)
  const seqLimit = pLimit(3)
  let prospectsCreated = 0
  let sendReadyCreated = 0
  let totalCostUsd = 0
  let emailSent = false
  const ranStrategies: RotationStrategy[] = []

  for (const strategy of strategies) {
    if (adaptive && sendReadyCreated >= dailyTarget) break
    if (adaptive && budget && budget.remaining <= 0) break
    if (adaptive && totalCostUsd >= costCapUsd) break

    const seqPromises: Promise<void>[] = []
    let sourceSendReady = 0
    const onProspectCreated = (payload: ProspectCreatedPayload) => {
      sourceSendReady += 1
      sendReadyCreated += 1
      if (account) seqPromises.push(seqLimit(() => createSequencesForProspect(payload, account)))
    }

    const result = await STRATEGY_HANDLERS[strategy].discover(
      product,
      filterSettings,
      emailSettings,
      onProspectCreated,
      {
        adaptive,
        budget,
        targetRemaining: Math.max(0, dailyTarget - sendReadyCreated),
        shouldStop: () => sendReadyCreated >= dailyTarget,
      }
    )
    await Promise.allSettled(seqPromises)
    ranStrategies.push(strategy)
    prospectsCreated += result.prospectsCreated
    totalCostUsd += result.totalCostUsd
    log.info("discovery source done", {
      productId: product.id,
      strategy,
      sourceSendReady,
      cumulativeSendReady: sendReadyCreated,
      remainingCandidateBudget: budget?.remaining,
      ...result,
    })

    if (result.prospectsCreated > 0 && profile?.email) {
      await STRATEGY_HANDLERS[strategy].sendAlert({
        to: profile.email,
        userId: product.user_id,
        userName: profile.name,
        productName: product.product_name,
        prospectsCreated: result.prospectsCreated,
      })
      emailSent = true
    } else if (result.prospectsCreated > 0) {
      log.warn("no profile email, skipping alert", { productId: product.id, userId: product.user_id })
    }
  }

  if (prospectsCreated > 0) {
    await assignSequences(product.user_id, product.id, account)
  }

  const stopReason = !adaptive
    ? undefined
    : sendReadyCreated >= dailyTarget
      ? "target_reached" as const
      : budget && budget.remaining <= 0
        ? "candidate_cap_reached" as const
        : totalCostUsd >= costCapUsd
          ? "cost_cap_reached" as const
          : "sources_exhausted" as const

  log.info("product discovery done", {
    productId: product.id,
    adaptive,
    strategies: ranStrategies,
    prospectsCreated,
    sendReadyCreated,
    totalCostUsd,
    stopReason,
  })

  return {
    strategy: ranStrategies[0] ?? null,
    strategies: ranStrategies,
    prospectsCreated,
    sendReadyCreated,
    totalCostUsd,
    emailSent,
    readinessReasons,
    stopReason,
  }
}

/**
 * Daily backlink discovery. Pilot products use competitor-first target filling
 * until their ready-opportunity, candidate, or cost cap is reached. Other
 * products retain the least-recently-run single-source rotation.
 */
export async function runDailyBacklinkDiscovery(options?: { paidOnly?: boolean }): Promise<void> {
  const paidOnly = options?.paidOnly ?? false
  log.info("starting", { paidOnly })

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors, target_keywords")

  if (error) {
    log.error("failed to fetch products", { error: error.message })
    return
  }

  type ProfileFields = {
    id: string
    email: string | null
    name: string | null
    tier: string
    active_trial: boolean
    deactivated_at: string | null
    outreach_paused_at: string | null
  }
  const userIds = [...new Set((products ?? []).map((p) => p.user_id))]
  const { data: profiles, error: profilesError } = await supabaseAdmin
    .from("profiles")
    .select("id, email, name, tier, active_trial, deactivated_at, outreach_paused_at")
    .in("id", userIds)

  if (profilesError) {
    log.error("failed to fetch profiles", { error: profilesError.message })
    return
  }

  const profileById = new Map((profiles ?? []).map((p) => [p.id, p as ProfileFields]))
  const withProfile = (products ?? []).map((p) => ({
    product: {
      id: p.id,
      user_id: p.user_id,
      product_name: p.product_name,
      product_description: p.product_description,
      website_url: p.website_url,
      competitors: (p.competitors as string[] | null) ?? null,
      target_keywords: (p.target_keywords as string[] | null) ?? null,
    } satisfies DiscoveryProduct,
    profile: profileById.get(p.user_id),
  }))

  const eligible = withProfile.filter(({ profile }) => {
    if (profile === undefined) return false
    if (profile.deactivated_at !== null) return false
    if (profile.outreach_paused_at !== null) return false
    if (paidOnly) return profile.tier !== "free" && !profile.active_trial
    return profile.tier !== "free" || profile.active_trial
  })

  log.info("products to process", {
    total: withProfile.length,
    eligible: eligible.length,
    skipped: withProfile.length - eligible.length,
  })

  const productLimit = pLimit(PRODUCT_CONCURRENCY)
  await Promise.allSettled(
    eligible.map(({ product, profile }) =>
      productLimit(async () => {
        try {
          const result = await runDiscoveryForProduct(product, profile)
          if (result.skipped) {
            log.info("product skipped", { productId: product.id, reason: result.skipped })
          }
        } catch (err) {
          log.error("discovery failed", { productId: product.id, error: String(err) })
        }
      })
    )
  )

  log.info("complete")
}
