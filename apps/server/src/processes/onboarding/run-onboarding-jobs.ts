import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { discoverCompetitorBacklinks, type ProspectCreatedPayload } from "../../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { discoverListicleRoundups } from "../../methods/listicle-roundup/discover-listicle-roundups.js"
import { crawlProductPages } from "../../methods/product-pages/crawl-product-pages.js"
import { discoverUnlinkedMentions } from "../../methods/unlinked-mentions/discover-unlinked-mentions.js"
import { createSequencesForProspect, assignSequences } from "./prospect-sequences.js"
import { resolveEmailAccount } from "./resolve-email-account.js"
import { sendOnboardingSummaryEmail } from "./summary-email.js"

const log = createLogger("onboarding-jobs")

// Light cap for the first (onboarding) discovery run — keep it fast and cheap.
// Daily jobs call the discovery methods without limits (full defaults).
const ONBOARDING_BACKLINK_LIMITS = { maxCompetitors: 1, maxProspects: 10, fetchLimit: 35 }
const ONBOARDING_MENTION_LIMITS = { maxCandidates: 8, maxProspects: 10 }
const ONBOARDING_LISTICLE_LIMITS = { maxCandidates: 8, maxProspects: 10 }

export async function runOnboardingJobs(
  userId: string,
  productId: string,
  pageLimit: number
): Promise<void> {
  const t0 = Date.now()
  log.info("jobs START", { userId, productId })

  // Fetch product + settings once, shared across both discovery branches.
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors")
    .eq("id", productId)
    .single()

  if (productError) log.warn("product fetch error", { productId, error: productError.message })

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
    .eq("product_id", productId)
    .single()

  if (settingsError) log.warn("settings fetch error", { productId, error: settingsError.message })

  const filterSettings = { dr_min: settings?.dr_min ?? 0, dr_max: settings?.dr_max ?? null }
  const emailSettings = { voice_tone: settings?.voice_tone ?? null, offering: settings?.offering ?? null }
  const opportunityTypes = settings?.opportunity_types ?? ["competitor_backlink", "unlinked_mention"]

  // Resolve email account once, upfront — shared by per-prospect streaming and the safety sweep.
  const account = await resolveEmailAccount(userId)

  // Per-prospect sequence tasks, decoupled from discovery so they don't block the enrich loop.
  const seqLimit = pLimit(3)
  const seqPromises: Promise<void>[] = []

  const onProspectCreated: ((p: ProspectCreatedPayload) => void) | undefined = account
    ? (p) => {
        seqPromises.push(seqLimit(() => createSequencesForProspect(p, account)))
      }
    : undefined

  const [backlinkDiscoveryResult, mentionDiscoveryResult, listicleDiscoveryResult, pagesResult] =
    await Promise.allSettled([
      (async () => {
        if (!product || !opportunityTypes.includes("competitor_backlink")) {
          if (!product) log.warn("discoverCompetitorBacklinks: product not found, skipping", { productId })
          return { prospectsCreated: 0, totalCostUsd: 0 }
        }
        const t = Date.now()
        log.info("discoverCompetitorBacklinks START", { productId })
        try {
          const result = await discoverCompetitorBacklinks(
            { ...product, competitors: (product.competitors as string[]) ?? [] },
            filterSettings,
            emailSettings,
            ONBOARDING_BACKLINK_LIMITS,
            undefined,
            onProspectCreated
          )
          log.success("discoverCompetitorBacklinks done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          log.error("discoverCompetitorBacklinks FAILED", { durationMs: Date.now() - t, error: String(err) })
          throw err
        }
      })(),
      (async () => {
        if (!product || !opportunityTypes.includes("unlinked_mention")) {
          if (!product) log.warn("discoverUnlinkedMentions: product not found, skipping", { productId })
          return { prospectsCreated: 0, totalCostUsd: 0 }
        }
        const t = Date.now()
        log.info("discoverUnlinkedMentions START", { productId })
        try {
          const result = await discoverUnlinkedMentions(
            product,
            filterSettings,
            emailSettings,
            ONBOARDING_MENTION_LIMITS,
            undefined,
            onProspectCreated
          )
          log.success("discoverUnlinkedMentions done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          log.error("discoverUnlinkedMentions FAILED", { durationMs: Date.now() - t, error: String(err) })
          throw err
        }
      })(),
      (async () => {
        if (!product || !opportunityTypes.includes("listicle_roundup")) {
          if (!product) log.warn("discoverListicleRoundups: product not found, skipping", { productId })
          return { prospectsCreated: 0, totalCostUsd: 0 }
        }
        const t = Date.now()
        log.info("discoverListicleRoundups START", { productId })
        try {
          const result = await discoverListicleRoundups(
            product,
            filterSettings,
            emailSettings,
            ONBOARDING_LISTICLE_LIMITS,
            undefined,
            onProspectCreated
          )
          log.success("discoverListicleRoundups done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          log.error("discoverListicleRoundups FAILED", { durationMs: Date.now() - t, error: String(err) })
          throw err
        }
      })(),
      (async () => {
        const t = Date.now()
        log.info("crawlProductPages START", { productId, pageLimit })
        try {
          const result = await crawlProductPages(productId, pageLimit)
          log.success("crawlProductPages done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          log.error("crawlProductPages FAILED", { durationMs: Date.now() - t, error: String(err) })
          throw err
        }
      })(),
    ])

  log.info("all jobs END", { durationMs: Date.now() - t0 })

  // Wait for all per-prospect sequence tasks to finish before the summary email.
  if (seqPromises.length > 0) {
    log.info("awaiting per-prospect sequence tasks", { count: seqPromises.length })
    await Promise.allSettled(seqPromises)
    log.info("per-prospect sequence tasks done")
  }

  // Safety-net sweep: catches any prospects whose per-prospect sequence insert failed.
  await assignSequences(userId, productId, account)

  if (backlinkDiscoveryResult.status === "rejected") {
    log.error("onboarding backlink discovery failed", {
      productId,
      error: String(backlinkDiscoveryResult.reason),
    })
  }

  if (mentionDiscoveryResult.status === "rejected") {
    log.error("onboarding mention discovery failed", {
      productId,
      error: String(mentionDiscoveryResult.reason),
    })
  }

  if (listicleDiscoveryResult.status === "rejected") {
    log.error("onboarding listicle discovery failed", {
      productId,
      error: String(listicleDiscoveryResult.reason),
    })
  }

  if (pagesResult.status === "rejected") {
    log.error("onboarding page crawl failed", {
      productId,
      error: String(pagesResult.reason),
    })
  }

  // Merge competitor backlinks + unlinked mentions + listicle roundups into one result for the summary email.
  const combinedBacklinkResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }> =
    backlinkDiscoveryResult.status === "fulfilled" ||
    mentionDiscoveryResult.status === "fulfilled" ||
    listicleDiscoveryResult.status === "fulfilled"
      ? {
          status: "fulfilled",
          value: {
            prospectsCreated:
              (backlinkDiscoveryResult.status === "fulfilled" ? backlinkDiscoveryResult.value.prospectsCreated : 0) +
              (mentionDiscoveryResult.status === "fulfilled" ? mentionDiscoveryResult.value.prospectsCreated : 0) +
              (listicleDiscoveryResult.status === "fulfilled" ? listicleDiscoveryResult.value.prospectsCreated : 0),
            totalCostUsd:
              (backlinkDiscoveryResult.status === "fulfilled" ? backlinkDiscoveryResult.value.totalCostUsd : 0) +
              (mentionDiscoveryResult.status === "fulfilled" ? mentionDiscoveryResult.value.totalCostUsd : 0) +
              (listicleDiscoveryResult.status === "fulfilled" ? listicleDiscoveryResult.value.totalCostUsd : 0),
          },
        }
      : backlinkDiscoveryResult

  await sendOnboardingSummaryEmail({
    userId,
    productId,
    backlinkDiscoveryResult: combinedBacklinkResult,
    pagesResult,
  })
}
