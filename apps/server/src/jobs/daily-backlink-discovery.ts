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
  emptyStrategyFunnel,
  type StrategyResult,
} from "../methods/prospect-generation-methods/shared/strategy-result.js"
import {
  getBrokenLinkCadenceDecision,
  getStrategyCooldownRuns,
  getStrategyPerformance,
  getUnlinkedMentionDecision,
  isStrategyCoolingDown,
  orderStrategiesByEfficiency,
  orderStrategiesByStaleness,
  type RotationHistoryRun,
} from "../methods/prospect-generation-methods/shared/strategy-rotation.js"
import { assignSequences, createSequencesForProspect } from "../processes/onboarding/prospect-sequences.js"
import { resolveEmailAccount } from "../processes/onboarding/resolve-email-account.js"
import { claimDailyExecution, countDailySendReady, finishDailyExecution } from "./daily-discovery-accounting.js"
import { DEFAULT_DAILY_DISCOVERY_SETTINGS, remainingDailyBudget } from "./daily-discovery-policy.js"
import {
  configurationReasonForSourceSkips,
  DailyDiscoveryStopController,
  type DailyDiscoveryStopReason,
} from "./daily-discovery-stop-controller.js"

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
  ) => Promise<StrategyResult>
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
        options?.adaptive
          ? { maxCandidates: 50, maxProspects: options.budget?.remaining }
          : {},
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
    discover: (product, filterSettings, emailSettings, onProspectCreated, options) =>
      discoverResourcePageInclusions(
        product,
        filterSettings,
        emailSettings,
        options?.adaptive ? { maxCandidates: 50, maxProspects: options.budget?.remaining } : {},
        options?.budget,
        onProspectCreated
      ),
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
    .from("backlink_prospect_runs")
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
    .from("backlink_prospect_runs")
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

type AdaptiveStrategyQueueEntry = {
  strategy: RotationStrategy
  explorationProbe: boolean
}

type StrategySkip = {
  strategy: RotationStrategy
  status: "skipped"
  skipReason: string
}

type PersistedStrategyFunnel = Record<string, string | number | boolean | null>

type AdaptiveStrategyQueue = {
  entries: AdaptiveStrategyQueueEntry[]
  skips: StrategySkip[]
}

async function getUnrunnableReason(
  product: DiscoveryProduct,
  strategy: RotationStrategy,
  adaptive: boolean
): Promise<string | null> {
  if (await STRATEGY_HANDLERS[strategy].isRunnable(product, adaptive)) return null
  if (strategy === "competitor_backlink") {
    return "competitor_backlink_requires_product_name_or_valid_competitor"
  }
  if (strategy === "unlinked_mention") return "unlinked_mention_requires_product_name"
  if (strategy === "listicle_roundup") return "listicle_roundup_requires_product_name"
  if (strategy === "resource_page_inclusion") {
    return "resource_page_inclusion_requires_crawled_target_page"
  }

  const hasUsableCompetitor = (product.competitors ?? []).some((competitor) => {
    const domain = extractCompetitorDomain(competitor)
    return Boolean(domain) && !isBlockedCompetitorDomain(domain)
  })
  return hasUsableCompetitor
    ? "broken_link_requires_crawled_replacement_page"
    : "broken_link_requires_valid_competitor"
}

async function buildAdaptiveStrategyQueue(
  product: DiscoveryProduct,
  enabled: RotationStrategy[],
  history: RotationHistoryRun[]
): Promise<AdaptiveStrategyQueue> {
  const preferred = orderStrategiesByEfficiency(enabled, history)
  const entries: AdaptiveStrategyQueueEntry[] = []
  const skips: StrategySkip[] = []

  for (const strategy of preferred) {
    const unrunnableReason = await getUnrunnableReason(product, strategy, true)
    if (unrunnableReason) {
      log.info("adaptive source not runnable", { productId: product.id, strategy, reason: unrunnableReason })
      skips.push({ strategy, status: "skipped", skipReason: unrunnableReason })
      continue
    }

    let explorationProbe = false
    if (strategy === "unlinked_mention") {
      const decision = getUnlinkedMentionDecision(history)
      if (!decision.shouldRun) {
        log.info("adaptive source skipped: low-volume probe not due", { productId: product.id, strategy })
        skips.push({ strategy, status: "skipped", skipReason: decision.skipReason! })
        continue
      }
      explorationProbe = decision.explorationProbe
    }
    if (strategy === "broken_link_building") {
      const decision = getBrokenLinkCadenceDecision(history)
      if (!decision.shouldRun) {
        log.info("adaptive source skipped: weekly scan not due", { productId: product.id, strategy })
        skips.push({ strategy, status: "skipped", skipReason: decision.skipReason! })
        continue
      }
    }
    if (isStrategyCoolingDown(history, strategy)) {
      log.info("adaptive source cooling down", { productId: product.id, strategy })
      skips.push({ strategy, status: "skipped", skipReason: "source_zero_yield_cooldown" })
      continue
    }
    entries.push({ strategy, explorationProbe })
  }

  return { entries, skips }
}

function commonFunnelFields(result: StrategyResult): PersistedStrategyFunnel {
  const funnel = result.funnel ?? emptyStrategyFunnel({ exhausted: result.prospectsCreated === 0 })
  return {
    candidatesGathered: funnel.candidatesGathered,
    candidatesFetched: funnel.candidatesFetched,
    candidatesQualified: funnel.candidatesQualified,
    enrichmentAttempts: funnel.enrichmentAttempts,
    prospectsInserted: funnel.prospectsInserted,
    contactReady: funnel.contactReady,
    sequenceReady: funnel.sequenceReady ?? null,
    emailNotFound: funnel.emailNotFound,
    enrichmentFailures: funnel.enrichmentFailures,
    persistenceFailures: funnel.persistenceFailures,
    callbackFailures: funnel.callbackFailures,
    transportFailures: funnel.transportFailures,
    duplicatesSkipped: funnel.duplicatesSkipped,
    budgetSkipped: funnel.budgetSkipped,
    exhausted: funnel.exhausted,
    cursorState: funnel.cursorState ?? null,
  }
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
  stopReason?:
    | "target_reached"
    | "attempt_cap_reached"
    | "cost_cap_reached"
    | "sources_exhausted"
    | "configuration_error"
  skipped?: string
}> {
  const settingsFields =
    "dr_min, dr_max, voice_tone, offering, opportunity_types, adaptive_discovery_enabled, daily_discovery_target, daily_discovery_candidate_cap, daily_discovery_attempt_cap, daily_discovery_cost_cap_usd" as const
  let { data: settings, error: settingsError } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select(settingsFields)
    .eq("product_id", product.id)
    .maybeSingle()

  if (settingsError) {
    log.error("failed to load discovery settings", {
      productId: product.id,
      error: settingsError.message,
    })
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      skipped: "settings_query_failed",
    }
  }

  if (!settings) {
    const { data: insertedSettings, error: insertSettingsError } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .insert({
        product_id: product.id,
        opportunity_types: ALL_OPPORTUNITY_TYPES,
        adaptive_discovery_enabled: DEFAULT_DAILY_DISCOVERY_SETTINGS.adaptiveDiscoveryEnabled,
        daily_discovery_target: DEFAULT_DAILY_DISCOVERY_SETTINGS.target,
        daily_discovery_candidate_cap: DEFAULT_DAILY_DISCOVERY_SETTINGS.candidateCap,
        daily_discovery_attempt_cap: DEFAULT_DAILY_DISCOVERY_SETTINGS.attemptCap,
        daily_discovery_cost_cap_usd: DEFAULT_DAILY_DISCOVERY_SETTINGS.costCapUsd,
      })
      .select(settingsFields)
      .single()

    if (insertSettingsError || !insertedSettings) {
      // A concurrent creator may have won the unique product_id insert. Reload
      // without upserting so an existing user's choices are never overwritten.
      const retry = await supabaseAdmin
        .from("backlink_prospects_settings")
        .select(settingsFields)
        .eq("product_id", product.id)
        .maybeSingle()
      settings = retry.data
      settingsError = retry.error
    } else {
      settings = insertedSettings
    }

    if (settingsError || !settings) {
      log.error("failed to create missing discovery settings", {
        productId: product.id,
        error: settingsError?.message ?? insertSettingsError?.message,
      })
      return {
        strategy: null,
        strategies: [],
        prospectsCreated: 0,
        sendReadyCreated: 0,
        totalCostUsd: 0,
        emailSent: false,
        skipped: "settings_creation_failed",
      }
    }
  }

  const opportunityTypes = settings?.opportunity_types ?? ALL_OPPORTUNITY_TYPES
  const enabled = ROTATION_STRATEGIES.filter((s) => opportunityTypes.includes(s))

  const adaptive = settings.adaptive_discovery_enabled
  const dailyTarget = Math.max(1, settings.daily_discovery_target)
  const attemptCap = Math.max(dailyTarget, settings.daily_discovery_attempt_cap)
  const costCapUsd = Math.max(0.01, settings.daily_discovery_cost_cap_usd)
  const claim = adaptive ? await claimDailyExecution(product.id, dailyTarget) : null

  if (adaptive && !claim) {
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      skipped: "daily_execution_already_running",
    }
  }

  const dailyBudget = claim
    ? remainingDailyBudget(
        dailyTarget,
        attemptCap,
        costCapUsd,
        claim.readyCount,
        claim.previousAttempts,
        claim.previousCostUsd
      )
    : {
        targetRemaining: dailyTarget,
        attemptsRemaining: attemptCap,
        costRemainingUsd: costCapUsd,
      }

  if (claim && dailyBudget.targetRemaining === 0) {
    await finishDailyExecution(claim, {
      readyCount: claim.readyCount,
      enrichmentAttempts: 0,
      insertedNotReadyCount: 0,
      costUsd: 0,
      strategyFunnels: [],
      stopReason: "target_reached",
    })
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      stopReason: "target_reached",
      skipped: "daily_target_already_reached",
    }
  }

  const carriedBudgetStopReason = claim
    ? dailyBudget.attemptsRemaining === 0
      ? ("attempt_cap_reached" as const)
      : dailyBudget.costRemainingUsd <= 0
        ? ("cost_cap_reached" as const)
        : null
    : null
  if (claim && carriedBudgetStopReason) {
    await finishDailyExecution(claim, {
      readyCount: claim.readyCount,
      enrichmentAttempts: 0,
      insertedNotReadyCount: 0,
      costUsd: 0,
      strategyFunnels: [],
      stopReason: carriedBudgetStopReason,
    })
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      stopReason: carriedBudgetStopReason,
      skipped: `daily_${carriedBudgetStopReason}`,
    }
  }

  if (enabled.length === 0) {
    if (claim) {
      await finishDailyExecution(claim, {
        readyCount: claim.readyCount,
        enrichmentAttempts: 0,
        insertedNotReadyCount: 0,
        costUsd: 0,
        strategyFunnels: [],
        stopReason: "configuration_error",
        configurationReason: "no_enabled_discovery_sources",
      })
    }
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      stopReason: "configuration_error",
      skipped: "no rotation strategies enabled",
    }
  }

  // Runs for every product, not just adaptive ones — a non-adaptive product
  // with zero crawled target pages would otherwise never get an automatic
  // crawl retry, permanently blocking resource_page_inclusion and
  // broken_link_building from ever producing a run.
  const readinessReasons = await ensureProductReadiness(product)
  const history = adaptive ? await loadStrategyHistory(product.id, enabled) : []
  const adaptiveQueue = adaptive
    ? await buildAdaptiveStrategyQueue(product, enabled, history)
    : { entries: [], skips: [] }
  const strategyEntries: AdaptiveStrategyQueueEntry[] = adaptive
    ? adaptiveQueue.entries
    : [await selectStrategyForRun(product, enabled)]
        .filter((value): value is RotationStrategy => value !== null)
        .map((strategy) => ({ strategy, explorationProbe: false }))
  const strategies = strategyEntries.map(({ strategy }) => strategy)

  if (strategies.length === 0) {
    const configurationReason = configurationReasonForSourceSkips(enabled, adaptiveQueue.skips)
    const emptyQueueStopReason = configurationReason ? "configuration_error" : "sources_exhausted"
    if (claim) {
      await finishDailyExecution(claim, {
        readyCount: claim.readyCount,
        enrichmentAttempts: 0,
        insertedNotReadyCount: 0,
        costUsd: 0,
        strategyFunnels: adaptiveQueue.skips,
        stopReason: emptyQueueStopReason,
        configurationReason,
      })
    }
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      readinessReasons,
      stopReason: emptyQueueStopReason,
      skipped: configurationReason ?? "all discovery sources cooling down or not due",
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

  const stopController = adaptive
    ? new DailyDiscoveryStopController(
        dailyTarget,
        claim?.readyCount ?? 0,
        dailyBudget.attemptsRemaining,
        dailyBudget.costRemainingUsd
      )
    : null

  log.info("discovery sources selected", {
    productId: product.id,
    adaptive,
    strategies,
    dailyTarget: adaptive ? dailyTarget : undefined,
    attemptCap: adaptive ? attemptCap : undefined,
    readyToday: claim?.readyCount,
    attemptsRemaining: adaptive ? dailyBudget.attemptsRemaining : undefined,
    costRemainingUsd: adaptive ? dailyBudget.costRemainingUsd : undefined,
    costCapUsd: adaptive ? costCapUsd : undefined,
    readinessReasons,
  })

  // Resolve the sending account once so newly-created prospects get their sequence
  // rows written in-flight with the LLM-generated step2/step3 bodies, the same way
  // onboarding does (run-onboarding-jobs.ts) — otherwise the safety-net sweep below
  // can't see them and always falls back to the templated follow-up.
  const account = await resolveEmailAccount(product.user_id)
  if (adaptive && claim && !account) {
    await finishDailyExecution(claim, {
      readyCount: claim.readyCount,
      enrichmentAttempts: 0,
      insertedNotReadyCount: 0,
      costUsd: 0,
      strategyFunnels: adaptiveQueue.skips,
      stopReason: "configuration_error",
      configurationReason: "no_sending_account",
    })
    return {
      strategy: null,
      strategies: [],
      prospectsCreated: 0,
      sendReadyCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      readinessReasons,
      stopReason: "configuration_error",
      skipped: "no sending account available",
    }
  }
  const seqLimit = pLimit(3)
  let prospectsCreated = 0
  let sendReadyCreated = 0
  let readyToday = claim?.readyCount ?? 0
  let totalCostUsd = 0
  let emailSent = false
  const ranStrategies: RotationStrategy[] = []
  const strategyFunnels: PersistedStrategyFunnel[] = [...adaptiveQueue.skips]
  let activeAllocation: ReturnType<DailyDiscoveryStopController["allocate"]> = null

  try {
    for (const entry of strategyEntries) {
      const { strategy } = entry
      if (stopController?.shouldStop()) break

      const resourcePerformance = getStrategyPerformance(history, "resource_page_inclusion")
      const higherYieldSourceRunnable = strategy === "resource_page_inclusion"
        && strategyEntries.some((candidate) =>
          candidate.strategy !== "resource_page_inclusion"
          && getStrategyPerformance(history, candidate.strategy).readyPerAttempt
            > resourcePerformance.readyPerAttempt
        )
      const allocation = stopController?.allocate(strategy, {
        history,
        explorationProbe: entry.explorationProbe,
        higherYieldSourceRunnable,
      })
      if (adaptive && !allocation) break
      activeAllocation = allocation ?? null
      const sourceBudget = allocation?.attemptBudget

      const seqPromises: Promise<void>[] = []
      let sourceSendReady = 0
      const onProspectCreated = (payload: ProspectCreatedPayload) => {
        if (!account) return
        seqPromises.push(
          seqLimit(async () => {
            await createSequencesForProspect(payload, account)
            sourceSendReady += 1
            readyToday += 1
          })
        )
      }

      const result = await STRATEGY_HANDLERS[strategy].discover(
        product,
        filterSettings,
        emailSettings,
        onProspectCreated,
        {
          adaptive,
          budget: sourceBudget,
          targetRemaining: stopController?.targetRemaining ?? dailyTarget,
          shouldStop: () => stopController?.shouldStop() ?? false,
        }
      )
      const sequenceResults = await Promise.allSettled(seqPromises)
      const sequenceFailures = sequenceResults.filter((sequenceResult) => sequenceResult.status === "rejected").length
      if (sequenceFailures > 0) {
        log.warn("some discovered prospects did not become send-ready", {
          productId: product.id,
          strategy,
          sequenceFailures,
        })
      }
      if (claim) readyToday = await countDailySendReady(product.id, claim.quotaDate)
      stopController?.reconcileReadyCount(readyToday)
      const attemptsUsed = allocation ? stopController?.commit(allocation, result.totalCostUsd) ?? 0 : 0
      activeAllocation = null
      sendReadyCreated = Math.max(0, readyToday - (claim?.readyCount ?? 0))
      ranStrategies.push(strategy)
      prospectsCreated += result.prospectsCreated
      totalCostUsd += result.totalCostUsd
      strategyFunnels.push({
        ...commonFunnelFields(result),
        strategy,
        prospectsCreated: result.prospectsCreated,
        enrichmentAttempts: attemptsUsed,
        sequenceReady: sourceSendReady,
        sequenceFailures,
        costUsd: result.totalCostUsd,
        allocationLimit: allocation?.attemptLimit ?? 0,
        estimatedReadyRate: allocation?.estimatedReadyRate ?? 0,
        explorationProbe: allocation?.explorationProbe ? 1 : 0,
      })
      log.info("discovery source done", {
        productId: product.id,
        strategy,
        sourceSendReady,
        cumulativeSendReady: sendReadyCreated,
        readyToday,
        remainingAttemptBudget: stopController?.attemptsRemaining,
        remainingCostBudgetUsd: stopController?.costRemainingUsd,
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
        log.warn("no profile email, skipping alert", {
          productId: product.id,
          userId: product.user_id,
        })
      }
    }

    if (prospectsCreated > 0) {
      await assignSequences(product.user_id, product.id, account)
      if (claim) {
        readyToday = await countDailySendReady(product.id, claim.quotaDate)
        stopController?.reconcileReadyCount(readyToday)
        sendReadyCreated = Math.max(0, readyToday - claim.readyCount)
      }
    }
  } catch (error) {
    if (activeAllocation) {
      stopController?.commit(activeAllocation, 0)
      activeAllocation = null
    }
    if (claim) {
      try {
        readyToday = await countDailySendReady(product.id, claim.quotaDate)
        const enrichmentAttempts = Math.max(0, dailyBudget.attemptsRemaining - (stopController?.attemptsRemaining ?? 0))
        await finishDailyExecution(claim, {
          readyCount: readyToday,
          enrichmentAttempts,
          insertedNotReadyCount: Math.max(0, prospectsCreated - Math.max(0, readyToday - claim.readyCount)),
          costUsd: totalCostUsd,
          strategyFunnels,
          stopReason: "transport_failure",
          lastError: String(error),
        })
      } catch (accountingError) {
        log.error("failed to persist discovery failure accounting", {
          productId: product.id,
          error: String(accountingError),
          discoveryError: String(error),
        })
      }
    }
    throw error
  }

  const stopReason = !adaptive
    ? undefined
    : stopController?.stopReason ?? ("sources_exhausted" as DailyDiscoveryStopReason)

  if (claim && stopReason) {
    const enrichmentAttempts = Math.max(0, dailyBudget.attemptsRemaining - (stopController?.attemptsRemaining ?? 0))
    await finishDailyExecution(claim, {
      readyCount: readyToday,
      enrichmentAttempts,
      insertedNotReadyCount: Math.max(0, prospectsCreated - sendReadyCreated),
      costUsd: totalCostUsd,
      strategyFunnels,
      stopReason,
    })
  }

  log.info("product discovery done", {
    productId: product.id,
    adaptive,
    strategies: ranStrategies,
    prospectsCreated,
    sendReadyCreated,
    readyToday,
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
