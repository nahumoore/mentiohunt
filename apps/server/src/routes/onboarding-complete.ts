import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { sendOnboardingCompleteEmail } from "../helpers/emails/send-onboarding-complete.js"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { discoverCompetitorBacklinks } from "../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { crawlProductPages } from "../methods/product-pages/crawl-product-pages.js"
import { discoverUnlinkedMentions } from "../methods/unlinked-mentions/discover-unlinked-mentions.js"
import { findDirectoryOpportunitiesForProduct } from "./find-directory-opportunities.js"

const log = createLogger("route-onboarding-complete")

// Light cap for the first (onboarding) discovery run — keep it fast and cheap.
// Daily jobs call the discovery methods without limits (full defaults).
const ONBOARDING_BACKLINK_LIMITS = { maxCompetitors: 2, maxProspects: 10 }
const ONBOARDING_MENTION_LIMITS = { maxCandidates: 12, maxProspects: 10 }

type DirectoryOnboardingResult = Awaited<ReturnType<typeof findDirectoryOpportunitiesForProduct>>

export const onboardingCompleteRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function readBodyString(body: unknown, key: string) {
  if (body === null || typeof body !== "object") return ""
  const value = (body as Record<string, unknown>)[key]
  return typeof value === "string" ? value.trim() : ""
}

async function sendOnboardingSummaryEmail({
  userId,
  productId,
  directoryResult,
  backlinkDiscoveryResult,
  pagesResult,
}: {
  userId: string
  productId: string
  directoryResult: PromiseSettledResult<DirectoryOnboardingResult>
  backlinkDiscoveryResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
  pagesResult: PromiseSettledResult<{
    pagesFound: number
    pagesCrawled: number
    pagesFailed: number
    totalCostUsd: number
  }>
}) {
  const [
    { data: profile, error: profileError },
    { data: product, error: productError },
  ] = await Promise.all([
    supabaseAdmin
      .from("profiles")
      .select("email, name")
      .eq("id", userId)
      .single(),
    supabaseAdmin
      .from("products")
      .select("product_name")
      .eq("id", productId)
      .eq("user_id", userId)
      .single(),
  ])

  if (profileError || !profile?.email) {
    log.warn("could not send onboarding summary email without profile email", {
      userId,
      error: profileError?.message,
    })
    return
  }

  if (productError || !product?.product_name) {
    log.warn("could not send onboarding summary email without product name", {
      productId,
      error: productError?.message,
    })
    return
  }

  await sendOnboardingCompleteEmail({
    to: profile.email,
    userId,
    userName: profile.name,
    productName: product.product_name,
    directoryResult,
    backlinkResult: backlinkDiscoveryResult,
    pagesResult,
  })
}

onboardingCompleteRouter.post("/onboarding/complete", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const productId = readBodyString(req.body, "productId")

  if (!userId || !productId) {
    res.status(400).json({
      error: "userId and productId are required",
    })
    return
  }

  const rawPageLimit =
    req.body !== null && typeof req.body === "object"
      ? Number((req.body as Record<string, unknown>)["pageLimit"])
      : NaN
  const pageLimit = Number.isFinite(rawPageLimit) && rawPageLimit > 0 ? rawPageLimit : 50

  res.status(202).json({ queued: true })

  withRouteLog(`onboarding-complete-${productId}`, () => runOnboardingJobs(userId, productId, pageLimit)).catch(
    (err) => log.error("unhandled onboarding jobs error", { error: String(err) })
  )
})

async function runOnboardingJobs(
  userId: string,
  productId: string,
  pageLimit: number
) {

  async function setEngineStatus(engine: string, status: "running" | "done" | "failed") {
    await supabaseAdmin.rpc("merge_discovery_status" as string, {
      p_product_id: productId,
      p_updates: { [engine]: status },
    })
  }

  try {
    const t0 = Date.now()
    log.info("jobs START", { userId, productId })

    const { error: statusUpdateError } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .update({
        discovery_status: {
          directories: "running",
          backlinks: "running",
          pages: "running",
          started_at: new Date().toISOString(),
          total: 3,
        },
      })
      .eq("product_id", productId)

    if (statusUpdateError) {
      log.error("failed to set initial discovery_status", { productId, error: statusUpdateError.message })
    }

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

    const [directoryResult, backlinkDiscoveryResult, mentionDiscoveryResult, pagesResult] = await Promise.allSettled([
      (async () => {
        const t = Date.now()
        log.info("findDirectoryOpportunities START", { productId })
        let failed = false
        try {
          const result = await findDirectoryOpportunitiesForProduct(productId)
          log.success("findDirectoryOpportunities done", { durationMs: Date.now() - t, result })
          return result
        } catch (err) {
          failed = true
          log.error("findDirectoryOpportunities FAILED", { durationMs: Date.now() - t, error: String(err) })
          await setEngineStatus("directories", "failed")
          throw err
        } finally {
          if (!failed) await setEngineStatus("directories", "done")
        }
      })(),
      (async () => {
        if (!product || !opportunityTypes.includes("competitor_backlink")) {
          if (!product) log.warn("discoverCompetitorBacklinks: product not found, skipping", { productId })
          return { prospectsCreated: 0, totalCostUsd: 0 }
        }
        const t = Date.now()
        log.info("discoverCompetitorBacklinks START", { productId })
        let failed = false
        try {
          const result = await discoverCompetitorBacklinks(
            { ...product, competitors: (product.competitors as string[]) ?? [] },
            filterSettings,
            emailSettings,
            ONBOARDING_BACKLINK_LIMITS
          )
          log.success("discoverCompetitorBacklinks done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          failed = true
          log.error("discoverCompetitorBacklinks FAILED", { durationMs: Date.now() - t, error: String(err) })
          await setEngineStatus("backlinks", "failed")
          throw err
        } finally {
          if (!failed) await setEngineStatus("backlinks", "done")
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
          const result = await discoverUnlinkedMentions(product, filterSettings, emailSettings, ONBOARDING_MENTION_LIMITS)
          log.success("discoverUnlinkedMentions done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          log.error("discoverUnlinkedMentions FAILED", { durationMs: Date.now() - t, error: String(err) })
          throw err
        }
      })(),
      (async () => {
        const t = Date.now()
        log.info("crawlProductPages START", { productId, pageLimit })
        let failed = false
        try {
          const result = await crawlProductPages(productId, pageLimit)
          log.success("crawlProductPages done", { durationMs: Date.now() - t, ...result })
          return result
        } catch (err) {
          failed = true
          log.error("crawlProductPages FAILED", { durationMs: Date.now() - t, error: String(err) })
          await setEngineStatus("pages", "failed")
          throw err
        } finally {
          if (!failed) await setEngineStatus("pages", "done")
        }
      })(),
    ])

    log.info("all jobs END", { durationMs: Date.now() - t0 })

    if (directoryResult.status === "rejected") {
      log.error("onboarding directory discovery failed", {
        productId,
        error: String(directoryResult.reason),
      })
    }

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

    if (pagesResult.status === "rejected") {
      log.error("onboarding page crawl failed", {
        productId,
        error: String(pagesResult.reason),
      })
    }

    // Merge competitor backlinks + unlinked mentions into one result for the summary email.
    const combinedBacklinkResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }> =
      backlinkDiscoveryResult.status === "fulfilled" || mentionDiscoveryResult.status === "fulfilled"
        ? {
            status: "fulfilled",
            value: {
              prospectsCreated:
                (backlinkDiscoveryResult.status === "fulfilled" ? backlinkDiscoveryResult.value.prospectsCreated : 0) +
                (mentionDiscoveryResult.status === "fulfilled" ? mentionDiscoveryResult.value.prospectsCreated : 0),
              totalCostUsd:
                (backlinkDiscoveryResult.status === "fulfilled" ? backlinkDiscoveryResult.value.totalCostUsd : 0) +
                (mentionDiscoveryResult.status === "fulfilled" ? mentionDiscoveryResult.value.totalCostUsd : 0),
            },
          }
        : backlinkDiscoveryResult

    await sendOnboardingSummaryEmail({
      userId,
      productId,
      directoryResult,
      backlinkDiscoveryResult: combinedBacklinkResult,
      pagesResult,
    })
  } catch (err) {
    log.error("unhandled onboarding jobs error", { error: String(err) })
    throw err
  }
}
