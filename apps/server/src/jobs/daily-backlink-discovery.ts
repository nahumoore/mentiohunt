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
import { ALL_OPPORTUNITY_TYPES } from "../methods/prospect-generation-methods/shared/opportunity-types.js"
import type { EmailSettings, ProspectCreatedPayload } from "../methods/prospect-generation-methods/shared/prospect-types.js"
import {
  getStrategyCooldownRuns,
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

type StrategyHandler = {
  /** Cheap precondition — a strategy that can only no-op shouldn't consume the product's daily slot. */
  isRunnable: (product: DiscoveryProduct) => Promise<boolean> | boolean
  discover: (
    product: DiscoveryProduct,
    filterSettings: FilterSettings,
    emailSettings: EmailSettings,
    onProspectCreated?: (p: ProspectCreatedPayload) => void
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
    isRunnable: (product) =>
      (product.competitors ?? []).some((competitor) => {
        const domain = extractCompetitorDomain(competitor)
        return Boolean(domain) && !isBlockedCompetitorDomain(domain)
      }),
    discover: (product, filterSettings, emailSettings, onProspectCreated) =>
      discoverCompetitorBacklinks(
        { ...product, competitors: product.competitors ?? [] },
        filterSettings,
        emailSettings,
        {},
        undefined,
        onProspectCreated
      ),
    sendAlert: sendCompetitorBacklinkAlertEmail,
  },
  unlinked_mention: {
    isRunnable: (product) => (product.product_name?.trim() ?? "") !== "",
    discover: (product, filterSettings, emailSettings, onProspectCreated) =>
      discoverUnlinkedMentions(product, filterSettings, emailSettings, {}, undefined, onProspectCreated),
    sendAlert: sendUnlinkedMentionAlertEmail,
  },
  listicle_roundup: {
    isRunnable: (product) => (product.product_name?.trim() ?? "") !== "",
    discover: (product, filterSettings, emailSettings, onProspectCreated) =>
      discoverListicleRoundups(product, filterSettings, emailSettings, {}, undefined, onProspectCreated),
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
    discover: async (product, filterSettings, emailSettings, onProspectCreated) => {
      const { prospectsCreated, totalCostUsd } = await discoverResourcePageInclusions(
        product,
        filterSettings,
        emailSettings,
        {},
        undefined,
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
    discover: (product, filterSettings, emailSettings, onProspectCreated) =>
      discoverBrokenLinkBuilding(
        { ...product, competitors: product.competitors ?? [] },
        filterSettings,
        emailSettings,
        {},
        undefined,
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

    if (await STRATEGY_HANDLERS[strategy].isRunnable(product)) return strategy
    log.info("strategy not runnable, trying next", { productId: product.id, strategy })
  }

  return null
}

export async function runDiscoveryForProduct(
  product: DiscoveryProduct,
  profile: { email: string | null; name: string | null } | undefined
): Promise<{
  strategy: RotationStrategy | null
  prospectsCreated: number
  totalCostUsd: number
  emailSent: boolean
  skipped?: string
}> {
  const { data: settings } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
    .eq("product_id", product.id)
    .single()

  const opportunityTypes = settings?.opportunity_types ?? ALL_OPPORTUNITY_TYPES
  const enabled = ROTATION_STRATEGIES.filter((s) => opportunityTypes.includes(s))

  if (enabled.length === 0) {
    return {
      strategy: null,
      prospectsCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
      skipped: "no rotation strategies enabled",
    }
  }

  const strategy = await selectStrategyForRun(product, enabled)
  if (!strategy) {
    return {
      strategy: null,
      prospectsCreated: 0,
      totalCostUsd: 0,
      emailSent: false,
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

  log.info("strategy selected", { productId: product.id, strategy })

  // Resolve the sending account once so newly-created prospects get their sequence
  // rows written in-flight with the LLM-generated step2/step3 bodies, the same way
  // onboarding does (run-onboarding-jobs.ts) — otherwise the safety-net sweep below
  // can't see them and always falls back to the templated follow-up.
  const account = await resolveEmailAccount(product.user_id)
  const seqLimit = pLimit(3)
  const seqPromises: Promise<void>[] = []
  const onProspectCreated: ((p: ProspectCreatedPayload) => void) | undefined = account
    ? (p) => {
        seqPromises.push(seqLimit(() => createSequencesForProspect(p, account)))
      }
    : undefined

  const result = await STRATEGY_HANDLERS[strategy].discover(product, filterSettings, emailSettings, onProspectCreated)
  await Promise.allSettled(seqPromises)
  log.info("discovery done", { productId: product.id, strategy, ...result })

  let emailSent = false
  if (result.prospectsCreated > 0) {
    await assignSequences(product.user_id, product.id, account)

    if (profile?.email) {
      await STRATEGY_HANDLERS[strategy].sendAlert({
        to: profile.email,
        userId: product.user_id,
        userName: profile.name,
        productName: product.product_name,
        prospectsCreated: result.prospectsCreated,
      })
      emailSent = true
    } else {
      log.warn("no profile email, skipping alert", { productId: product.id, userId: product.user_id })
    }
  }

  return { strategy, emailSent, ...result }
}

/**
 * Daily backlink discovery — one prospect-generation method per product per
 * day, rotating least-recently-run first across the strategies the product has
 * enabled in backlink_prospects_settings.opportunity_types. Runs for every
 * paid/trial product and emails the user a method-specific summary whenever it
 * finds at least one new prospect.
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
