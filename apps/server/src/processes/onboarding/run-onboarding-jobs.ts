import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { discoverBrokenLinkBuilding } from "../../methods/prospect-generation-methods/broken-link-building/index.js"
import { discoverCompetitorBacklinks } from "../../methods/prospect-generation-methods/competitor-backlink/index.js"
import { discoverListicleRoundups } from "../../methods/prospect-generation-methods/listicle-roundup/index.js"
import { discoverResourcePageInclusions } from "../../methods/prospect-generation-methods/resource-page-inclusion/index.js"
import { ALL_OPPORTUNITY_TYPES } from "../../methods/prospect-generation-methods/shared/opportunity-types.js"
import type { ProspectCreatedPayload } from "../../methods/prospect-generation-methods/shared/prospect-types.js"
import { discoverUnlinkedMentions } from "../../methods/prospect-generation-methods/unlinked-mention/index.js"
import { crawlProductPages } from "../../methods/product-pages/crawl-product-pages.js"
import {
  createSequencesForProspect,
  assignSequences,
} from "./prospect-sequences.js"
import { resolveEmailAccount } from "./resolve-email-account.js"
import { sendOnboardingSummaryEmail } from "./summary-email.js"
import { sendPreviewResultsEmail } from "../../helpers/emails/send-preview-results.js"
import { captureServerEvent } from "../../helpers/analytics.js"

const log = createLogger("onboarding-jobs")

// Light cap for the first (onboarding) discovery run — keep it fast and cheap.
// Daily jobs call the discovery methods without limits (full defaults).
//
// maxCandidates for listicle/mention only trims the post-SERP scoring pool —
// the SERP spend (MAX_QUERIES_PER_RUN * SERP_RESULTS_PER_QUERY, module
// constants the caller can't lower) already happened by the time this limit
// applies, so raising it adds no extra SERP/DataForSEO calls, only cheap
// fetch/scoring on candidates already paid for.
const ONBOARDING_BACKLINK_LIMITS_BASE = { maxProspects: 10, fetchLimit: 35 }
const ONBOARDING_MENTION_LIMITS = { maxCandidates: 15, maxProspects: 10 }
const ONBOARDING_LISTICLE_LIMITS = { maxCandidates: 25, maxProspects: 10 }

// resource_page_inclusion and broken_link_building both require crawled
// product_pages rows, so they run in a second stage after the crawl (stage 1
// below) finishes, instead of racing it.
const ONBOARDING_RPI_LIMITS = { maxProspects: 10 }
// At most three competitors can contribute ten backlink opportunities each,
// the mention/listicle/resource strategies can contribute ten each, and
// broken-link building can contribute five per competitor. This is a display
// safety bound, not a smaller preview discovery budget.
const ONBOARDING_RESULT_LIMIT = 75

type OnboardingRunOptions =
  | { mode?: "activated" }
  | { mode: "preview"; previewId: string }

export async function runOnboardingJobs(
  userId: string,
  productId: string,
  pageLimit: number,
  autoDiscoverPages = true,
  options: OnboardingRunOptions = { mode: "activated" }
): Promise<void> {
  const t0 = Date.now()
  const previewMode = options.mode === "preview"
  const previewId = previewMode ? options.previewId : null
  const enrichmentBudget = previewMode ? { remaining: 0 } : undefined
  log.info("jobs START", {
    userId,
    productId,
    mode: previewMode ? "preview" : "activated",
  })

  if (previewId) {
    const { data: claimedPreview } = await supabaseAdmin
      .from("onboarding_previews")
      .update({
        status: "processing",
        started_at: new Date().toISOString(),
        failure_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", previewId)
      .eq("user_id", userId)
      .eq("product_id", productId)
      .in("status", ["pending", "failed"])
      .select("id")
      .maybeSingle()
    if (!claimedPreview) {
      log.info("preview already claimed or completed", { previewId, productId })
      return
    }
    void captureServerEvent("onboarding_preview_started", userId, {
      preview_id: previewId,
      product_id: productId,
    })
  }

  // Fetch product + settings once, shared across both discovery branches.
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select(
      "id, user_id, product_name, product_description, website_url, competitors, target_keywords"
    )
    .eq("id", productId)
    .single()

  if (productError)
    log.warn("product fetch error", { productId, error: productError.message })

  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("dr_min, dr_max, voice_tone, offering, opportunity_types")
    .eq("product_id", productId)
    .single()

  if (settingsError)
    log.warn("settings fetch error", {
      productId,
      error: settingsError.message,
    })

  const filterSettings = {
    dr_min: settings?.dr_min ?? 0,
    dr_max: settings?.dr_max ?? null,
  }
  const emailSettings = {
    voice_tone: settings?.voice_tone ?? null,
    offering: settings?.offering ?? null,
  }
  const opportunityTypes = settings?.opportunity_types ?? ALL_OPPORTUNITY_TYPES

  // Resolve email account once, upfront — shared by per-prospect streaming and the safety sweep.
  const account = previewMode ? null : await resolveEmailAccount(userId)

  // Per-prospect sequence tasks, decoupled from discovery so they don't block the enrich loop.
  const seqLimit = pLimit(3)
  const seqPromises: Promise<void>[] = []

  const onProspectCreated: ((p: ProspectCreatedPayload) => void) | undefined =
    account
      ? (p) => {
          seqPromises.push(
            seqLimit(() => createSequencesForProspect(p, account))
          )
        }
      : undefined

  const [
    backlinkDiscoveryResult,
    mentionDiscoveryResult,
    listicleDiscoveryResult,
    pagesResult,
  ] = await Promise.allSettled([
    (async () => {
      if (!product || !opportunityTypes.includes("competitor_backlink")) {
        if (!product)
          log.warn("discoverCompetitorBacklinks: product not found, skipping", {
            productId,
          })
        return { prospectsCreated: 0, totalCostUsd: 0 }
      }
      const t = Date.now()
      log.info("discoverCompetitorBacklinks START", { productId })
      try {
        const competitors = (product.competitors as string[]) ?? []
        const onboardingBacklinkLimits = {
          ...ONBOARDING_BACKLINK_LIMITS_BASE,
          maxCompetitors: Math.max(1, Math.min(3, competitors.length)),
        }
        const result = await discoverCompetitorBacklinks(
          { ...product, competitors },
          filterSettings,
          emailSettings,
          onboardingBacklinkLimits,
          undefined,
          onProspectCreated,
          enrichmentBudget
        )
        log.success("discoverCompetitorBacklinks done", {
          durationMs: Date.now() - t,
          ...result,
        })
        return result
      } catch (err) {
        log.error("discoverCompetitorBacklinks FAILED", {
          durationMs: Date.now() - t,
          error: String(err),
        })
        throw err
      }
    })(),
    (async () => {
      if (!product || !opportunityTypes.includes("unlinked_mention")) {
        if (!product)
          log.warn("discoverUnlinkedMentions: product not found, skipping", {
            productId,
          })
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
          onProspectCreated,
          enrichmentBudget
        )
        log.success("discoverUnlinkedMentions done", {
          durationMs: Date.now() - t,
          ...result,
        })
        return result
      } catch (err) {
        log.error("discoverUnlinkedMentions FAILED", {
          durationMs: Date.now() - t,
          error: String(err),
        })
        throw err
      }
    })(),
    (async () => {
      if (!product || !opportunityTypes.includes("listicle_roundup")) {
        if (!product)
          log.warn("discoverListicleRoundups: product not found, skipping", {
            productId,
          })
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
          onProspectCreated,
          enrichmentBudget
        )
        log.success("discoverListicleRoundups done", {
          durationMs: Date.now() - t,
          ...result,
        })
        return result
      } catch (err) {
        log.error("discoverListicleRoundups FAILED", {
          durationMs: Date.now() - t,
          error: String(err),
        })
        throw err
      }
    })(),
    (async () => {
      const t = Date.now()
      log.info("crawlProductPages START", { productId, pageLimit })
      try {
        const result = await crawlProductPages(productId, {
          crawlLimit: pageLimit,
          autoDiscover: autoDiscoverPages,
        })
        log.success("crawlProductPages done", {
          durationMs: Date.now() - t,
          ...result,
        })
        return result
      } catch (err) {
        log.error("crawlProductPages FAILED", {
          durationMs: Date.now() - t,
          error: String(err),
        })
        throw err
      }
    })(),
  ])

  log.info("stage 1 (competitor/mention/listicle/crawl) END", {
    durationMs: Date.now() - t0,
  })

  // Stage 2: resource_page_inclusion and broken_link_building both require
  // crawled product_pages rows, so they run only after the crawl above has
  // resolved, rather than racing it inside the same Promise.allSettled — that
  // race is why neither method could ever produce results during onboarding
  // before this change.
  let rpiResult = { prospectsCreated: 0, totalCostUsd: 0 }
  let blbResult = { prospectsCreated: 0, totalCostUsd: 0 }
  let rpiSettled:
    | PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
    | undefined
  let blbSettled:
    | PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
    | undefined

  const crawlProducedPages =
    pagesResult.status === "fulfilled" && pagesResult.value.pagesSelected > 0

  if (product && crawlProducedPages) {
    const t2 = Date.now()
    ;[rpiSettled, blbSettled] = await Promise.allSettled([
      (async () => {
        if (!opportunityTypes.includes("resource_page_inclusion"))
          return { prospectsCreated: 0, totalCostUsd: 0 }
        const t = Date.now()
        log.info("discoverResourcePageInclusions START", { productId })
        try {
          const result = await discoverResourcePageInclusions(
            product,
            filterSettings,
            emailSettings,
            ONBOARDING_RPI_LIMITS,
            undefined,
            onProspectCreated,
            enrichmentBudget
          )
          log.success("discoverResourcePageInclusions done", {
            durationMs: Date.now() - t,
            ...result,
          })
          return {
            prospectsCreated: result.prospectsCreated,
            totalCostUsd: result.totalCostUsd,
          }
        } catch (err) {
          log.error("discoverResourcePageInclusions FAILED", {
            durationMs: Date.now() - t,
            error: String(err),
          })
          throw err
        }
      })(),
      (async () => {
        const competitors = (product.competitors as string[]) ?? []
        if (
          !opportunityTypes.includes("broken_link_building") ||
          competitors.length === 0
        ) {
          return { prospectsCreated: 0, totalCostUsd: 0 }
        }
        const t = Date.now()
        log.info("discoverBrokenLinkBuilding START", { productId })
        try {
          const result = await discoverBrokenLinkBuilding(
            { ...product, competitors },
            filterSettings,
            emailSettings,
            {
              maxCompetitors: Math.max(1, Math.min(3, competitors.length)),
              maxProspects: 5,
            },
            undefined,
            onProspectCreated,
            enrichmentBudget
          )
          log.success("discoverBrokenLinkBuilding done", {
            durationMs: Date.now() - t,
            ...result,
          })
          return result
        } catch (err) {
          log.error("discoverBrokenLinkBuilding FAILED", {
            durationMs: Date.now() - t,
            error: String(err),
          })
          throw err
        }
      })(),
    ])

    if (rpiSettled.status === "fulfilled") rpiResult = rpiSettled.value
    if (blbSettled.status === "fulfilled") blbResult = blbSettled.value

    log.info("stage 2 (resource_page_inclusion/broken_link_building) END", {
      durationMs: Date.now() - t2,
    })
  } else {
    log.info("skipping stage 2 — crawl produced no crawled pages", {
      productId,
    })
  }

  log.info("all jobs END", { durationMs: Date.now() - t0 })

  // Wait for all per-prospect sequence tasks to finish before the summary email.
  if (seqPromises.length > 0) {
    log.info("awaiting per-prospect sequence tasks", {
      count: seqPromises.length,
    })
    await Promise.allSettled(seqPromises)
    log.info("per-prospect sequence tasks done")
  }

  // Safety-net sweep: catches any prospects whose per-prospect sequence insert failed.
  if (!previewMode) await assignSequences(userId, productId, account)

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

  if (rpiSettled?.status === "rejected") {
    log.error("onboarding resource_page_inclusion failed", {
      productId,
      error: String(rpiSettled.reason),
    })
  }

  if (blbSettled?.status === "rejected") {
    log.error("onboarding broken_link_building failed", {
      productId,
      error: String(blbSettled.reason),
    })
  }

  // Merge all five discovery methods into one result for the summary email.
  const anyDiscoverySucceeded =
    backlinkDiscoveryResult.status === "fulfilled" ||
    mentionDiscoveryResult.status === "fulfilled" ||
    listicleDiscoveryResult.status === "fulfilled" ||
    rpiSettled?.status === "fulfilled" ||
    blbSettled?.status === "fulfilled"

  const combinedBacklinkResult: PromiseSettledResult<{
    prospectsCreated: number
    totalCostUsd: number
  }> = anyDiscoverySucceeded
    ? {
        status: "fulfilled",
        value: {
          prospectsCreated:
            (backlinkDiscoveryResult.status === "fulfilled"
              ? backlinkDiscoveryResult.value.prospectsCreated
              : 0) +
            (mentionDiscoveryResult.status === "fulfilled"
              ? mentionDiscoveryResult.value.prospectsCreated
              : 0) +
            (listicleDiscoveryResult.status === "fulfilled"
              ? listicleDiscoveryResult.value.prospectsCreated
              : 0) +
            rpiResult.prospectsCreated +
            blbResult.prospectsCreated,
          totalCostUsd:
            (backlinkDiscoveryResult.status === "fulfilled"
              ? backlinkDiscoveryResult.value.totalCostUsd
              : 0) +
            (mentionDiscoveryResult.status === "fulfilled"
              ? mentionDiscoveryResult.value.totalCostUsd
              : 0) +
            (listicleDiscoveryResult.status === "fulfilled"
              ? listicleDiscoveryResult.value.totalCostUsd
              : 0) +
            rpiResult.totalCostUsd +
            blbResult.totalCostUsd,
        },
      }
    : backlinkDiscoveryResult

  if (!previewMode) {
    await sendOnboardingSummaryEmail({
      userId,
      productId,
      backlinkDiscoveryResult: combinedBacklinkResult,
      pagesResult,
    })
    return
  }

  if (!previewId) return

  const { data: previewProspects, error: previewProspectsError } =
    await supabaseAdmin
      .from("backlink_prospects")
      .select(
        "id, domain, found_url, domain_rating, site_relevance_score, tier"
      )
      .eq("product_id", productId)
      .order("site_relevance_score", { ascending: false, nullsFirst: false })
      .order("domain_rating", { ascending: false, nullsFirst: false })
      .limit(ONBOARDING_RESULT_LIMIT)

  if (previewProspectsError) throw new Error(previewProspectsError.message)

  const results = previewProspects ?? []
  const { data: previewOwner } = await supabaseAdmin
    .from("profiles")
    .select("email, name")
    .eq("id", userId)
    .single()
  const resultCount = results.length
  const totalCostUsd =
    (combinedBacklinkResult.status === "fulfilled"
      ? combinedBacklinkResult.value.totalCostUsd
      : 0) +
    (pagesResult.status === "fulfilled" ? pagesResult.value.totalCostUsd : 0)
  const completedAt = new Date().toISOString()
  const status = resultCount > 0 ? "ready" : "partial"

  const { error: previewUpdateError } = await supabaseAdmin
    .from("onboarding_previews")
    .update({
      status,
      completed_at: completedAt,
      result_count: resultCount,
      result_ids: results.map((prospect) => prospect.id),
      sample_prospect_id: null,
      cost_usd: totalCostUsd,
      updated_at: completedAt,
    })
    .eq("id", previewId)
    .eq("status", "processing")

  if (previewUpdateError) throw new Error(previewUpdateError.message)
  void captureServerEvent("onboarding_preview_ready", userId, {
    preview_id: previewId,
    product_id: productId,
    result_count: resultCount,
    duration_ms: Date.now() - t0,
    cost_usd: totalCostUsd,
    status,
  })

  const [{ data: previewProduct }, { data: previewRecord }] = await Promise.all(
    [
      supabaseAdmin
        .from("products")
        .select("product_name")
        .eq("id", productId)
        .single(),
      supabaseAdmin
        .from("onboarding_previews")
        .select("results_email_sent_at")
        .eq("id", previewId)
        .single(),
    ]
  )

  if (
    previewOwner?.email &&
    previewProduct?.product_name &&
    !previewRecord?.results_email_sent_at
  ) {
    const opportunityCopy = results.map((prospect) => {
      const reason =
        prospect.tier === "unlinked_mention"
          ? "This page already mentions your market, so adding a useful source link is a natural next step."
          : prospect.tier === "listicle_roundup"
            ? "This roundup reaches readers comparing products like yours."
            : prospect.tier === "resource_page_inclusion"
              ? "This curated page covers the same topic as one of your strongest resources."
              : prospect.tier === "broken_link_building"
                ? "This page links to a resource that no longer works, and you have a relevant replacement."
                : "This site already links to a close competitor and is relevant to your category."
      const angle =
        prospect.tier === "unlinked_mention"
          ? "Offer the most relevant page on your site as the missing source."
          : prospect.tier === "listicle_roundup"
            ? "Pitch your product as a useful addition with a concise differentiator."
            : prospect.tier === "resource_page_inclusion"
              ? "Offer the selected resource as a useful addition for its readers."
              : prospect.tier === "broken_link_building"
                ? "Point out the broken link and offer your page as a low-pressure replacement."
                : "Suggest your target page as a complementary or fresher resource."
      return {
        domain: prospect.domain ?? prospect.found_url ?? "Opportunity",
        domainRating: prospect.domain_rating,
        reason,
        angle,
      }
    })
    const sent = await sendPreviewResultsEmail({
      to: previewOwner.email,
      userName: previewOwner.name,
      productName: previewProduct.product_name,
      opportunities: opportunityCopy,
      previewId,
    })
    if (sent) {
      await supabaseAdmin
        .from("onboarding_previews")
        .update({ results_email_sent_at: new Date().toISOString() })
        .eq("id", previewId)
        .is("results_email_sent_at", null)
      void captureServerEvent("onboarding_preview_email_sent", userId, {
        preview_id: previewId,
        product_id: productId,
        result_count: resultCount,
        status,
      })
    }
  }
}
