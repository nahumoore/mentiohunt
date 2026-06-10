import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { sendOnboardingCompleteEmail } from "../helpers/emails/send-onboarding-complete.js"
import { createLogger } from "../helpers/logger.js"
import { discoverCompetitorBacklinks } from "../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { discoverMentionsForProduct } from "../methods/media-mentions/discover-mentions-for-product.js"
import { findDirectoryOpportunitiesForProduct } from "./find-directory-opportunities.js"
import { runReplyQueueForConfig } from "./run-reply-queue.js"

const log = createLogger("route-onboarding-complete")

const SEND_INDIVIDUAL_ONBOARDING_EMAILS = false

type ReplyQueueOnboardingResult = Awaited<ReturnType<typeof runReplyQueueForConfig>>
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
  replyQueueResult,
  directoryResult,
  backlinkDiscoveryResult,
  mediaMentionsResult,
}: {
  userId: string
  productId: string
  replyQueueResult: PromiseSettledResult<ReplyQueueOnboardingResult>
  directoryResult: PromiseSettledResult<DirectoryOnboardingResult>
  backlinkDiscoveryResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
  mediaMentionsResult: PromiseSettledResult<{ prospectsCreated: number; totalCostUsd: number }>
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
    replyQueueResult,
    directoryResult,
    backlinkResult: backlinkDiscoveryResult,
    mediaMentionsResult,
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
  const replyQueueConfigId = readBodyString(req.body, "replyQueueConfigId")

  if (!userId || !productId || !replyQueueConfigId) {
    res.status(400).json({
      error: "userId, productId, and replyQueueConfigId are required",
    })
    return
  }

  async function setEngineStatus(engine: string, status: "running" | "done" | "failed") {
    await supabaseAdmin.rpc("merge_discovery_status" as string, {
      p_product_id: productId,
      p_updates: { [engine]: status },
    })
  }

  try {
    const t0 = Date.now()
    log.info("jobs START", { userId, productId, replyQueueConfigId })

    const { error: statusUpdateError } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .update({
        discovery_status: {
          community: "running",
          directories: "running",
          backlinks: "running",
          media_mentions: "running",
          started_at: new Date().toISOString(),
          total: 4,
        },
      })
      .eq("product_id", productId)

    if (statusUpdateError) {
      log.error("failed to set initial discovery_status", { productId, error: statusUpdateError.message })
    }

    const [replyQueueResult, directoryResult, backlinkDiscoveryResult, mediaMentionsResult] = await Promise.allSettled([
      (async () => {
        const t = Date.now()
        log.info("runReplyQueueForConfig START", { configId: replyQueueConfigId })
        let failed = false
        try {
          const result = await runReplyQueueForConfig({
            configId: replyQueueConfigId,
            userId,
            sendEmailAlerts: SEND_INDIVIDUAL_ONBOARDING_EMAILS,
            maxPosts: 50,
          })
          log.success("runReplyQueueForConfig done", { durationMs: Date.now() - t, result })
          return result
        } catch (err) {
          failed = true
          log.error("runReplyQueueForConfig FAILED", { durationMs: Date.now() - t, error: String(err) })
          await setEngineStatus("community", "failed")
          throw err
        } finally {
          if (!failed) await setEngineStatus("community", "done")
        }
      })(),
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
        const t = Date.now()
        log.info("discoverCompetitorBacklinks START", { productId })
        let failed = false
        try {
          const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("id, user_id, product_name, product_description, website_url, competitors")
            .eq("id", productId)
            .single()

          if (productError) log.warn("discoverCompetitorBacklinks: product fetch error", { error: productError.message })
          if (!product) {
            log.warn("discoverCompetitorBacklinks: product not found, skipping", { productId })
            return { prospectsCreated: 0, totalCostUsd: 0 }
          }

          const { data: settings, error: settingsError } = await supabaseAdmin
            .from("backlink_prospects_settings")
            .select("dr_min, dr_max, voice_tone, offering")
            .eq("product_id", productId)
            .single()

          if (settingsError) log.warn("discoverCompetitorBacklinks: settings fetch error", { error: settingsError.message })

          const result = await discoverCompetitorBacklinks(
            { ...product, competitors: (product.competitors as string[]) ?? [] },
            { dr_min: settings?.dr_min ?? 0, dr_max: settings?.dr_max ?? null },
            { voice_tone: settings?.voice_tone ?? null, offering: settings?.offering ?? null }
          )
          log.success("discoverCompetitorBacklinks done", { durationMs: Date.now() - t, prospectsCreated: result.prospectsCreated, totalCostUsd: result.totalCostUsd })
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
        const t = Date.now()
        log.info("discoverMentionsForProduct START", { productId })
        let failed = false
        try {
          const { data: product, error: productError } = await supabaseAdmin
            .from("products")
            .select("id, product_name, product_description, website_url, competitors")
            .eq("id", productId)
            .single()

          if (productError) log.warn("discoverMentionsForProduct: product fetch error", { error: productError.message })
          if (!product) {
            log.warn("discoverMentionsForProduct: product not found, skipping", { productId })
            return { prospectsCreated: 0, totalCostUsd: 0 }
          }

          const result = await discoverMentionsForProduct({
            ...product,
            competitors: (product.competitors as string[]) ?? [],
          })
          log.success("discoverMentionsForProduct done", { durationMs: Date.now() - t, prospectsCreated: result.prospectsCreated, totalCostUsd: result.totalCostUsd })
          return result
        } catch (err) {
          failed = true
          log.error("discoverMentionsForProduct FAILED", { durationMs: Date.now() - t, error: String(err) })
          await setEngineStatus("media_mentions", "failed")
          throw err
        } finally {
          if (!failed) await setEngineStatus("media_mentions", "done")
        }
      })(),
    ])

    log.info("all jobs END", { durationMs: Date.now() - t0 })

    if (replyQueueResult.status === "rejected") {
      log.error("onboarding reply queue run failed", {
        configId: replyQueueConfigId,
        error: String(replyQueueResult.reason),
      })
    }

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

    if (mediaMentionsResult.status === "rejected") {
      log.error("onboarding media mentions discovery failed", {
        productId,
        error: String(mediaMentionsResult.reason),
      })
    }

    await sendOnboardingSummaryEmail({
      userId,
      productId,
      replyQueueResult,
      directoryResult,
      backlinkDiscoveryResult,
      mediaMentionsResult,
    })

    res.json({
      success: true,
      replyQueue: replyQueueResult.status === "fulfilled" ? replyQueueResult.value : null,
      directoryOpportunities: directoryResult.status === "fulfilled" ? directoryResult.value : null,
      backlinkDiscovery: backlinkDiscoveryResult.status === "fulfilled" ? backlinkDiscoveryResult.value : null,
      mediaMentions: mediaMentionsResult.status === "fulfilled" ? mediaMentionsResult.value : null,
    })
  } catch (err) {
    log.error("unhandled onboarding jobs error", { error: String(err) })
    res.status(500).json({ error: "Failed to run onboarding jobs." })
  }
})
