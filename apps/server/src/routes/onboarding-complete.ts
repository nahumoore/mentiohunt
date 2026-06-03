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
}: {
  userId: string
  productId: string
  replyQueueResult: PromiseSettledResult<ReplyQueueOnboardingResult>
  directoryResult: PromiseSettledResult<DirectoryOnboardingResult>
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

  try {
    const t0 = Date.now()
    console.log("[onboarding] jobs START", { userId, productId, replyQueueConfigId })

    const [replyQueueResult, directoryResult, backlinkDiscoveryResult, mediaMentionsResult] = await Promise.allSettled([
      (async () => {
        const t = Date.now()
        console.log("[onboarding] runReplyQueueForConfig START")
        try {
          return await runReplyQueueForConfig({
            configId: replyQueueConfigId,
            userId,
            sendEmailAlerts: SEND_INDIVIDUAL_ONBOARDING_EMAILS,
            maxPosts: 50,
          })
        } finally {
          console.log(`[onboarding] runReplyQueueForConfig END ${Date.now() - t}ms`)
        }
      })(),
      (async () => {
        const t = Date.now()
        console.log("[onboarding] findDirectoryOpportunities START")
        try {
          return await findDirectoryOpportunitiesForProduct(productId)
        } finally {
          console.log(`[onboarding] findDirectoryOpportunities END ${Date.now() - t}ms`)
        }
      })(),
      (async () => {
        const t = Date.now()
        console.log("[onboarding] discoverCompetitorBacklinks START")
        try {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("id, user_id, product_name, product_description, website_url, competitors")
            .eq("id", productId)
            .single()

          if (!product) return { prospectsCreated: 0, totalCostUsd: 0 }

          const { data: settings } = await supabaseAdmin
            .from("backlink_prospects_settings")
            .select("dr_min, dr_max, voice_tone, offering")
            .eq("product_id", productId)
            .single()

          return await discoverCompetitorBacklinks(
            { ...product, competitors: (product.competitors as string[]) ?? [] },
            { dr_min: settings?.dr_min ?? 0, dr_max: settings?.dr_max ?? null },
            { voice_tone: settings?.voice_tone ?? null, offering: settings?.offering ?? null }
          )
        } finally {
          console.log(`[onboarding] discoverCompetitorBacklinks END ${Date.now() - t}ms`)
        }
      })(),
      (async () => {
        const t = Date.now()
        console.log("[onboarding] discoverMentionsForProduct START")
        try {
          const { data: product } = await supabaseAdmin
            .from("products")
            .select("id, product_name, product_description, website_url, competitors")
            .eq("id", productId)
            .single()

          if (!product) return { prospectsCreated: 0, totalCostUsd: 0 }

          return await discoverMentionsForProduct({
            ...product,
            competitors: (product.competitors as string[]) ?? [],
          })
        } finally {
          console.log(`[onboarding] discoverMentionsForProduct END ${Date.now() - t}ms`)
        }
      })(),
    ])

    console.log(`[onboarding] all jobs END ${Date.now() - t0}ms`)

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
