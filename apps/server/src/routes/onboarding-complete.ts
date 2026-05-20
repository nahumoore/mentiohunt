import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { sendOnboardingCompleteEmail } from "../helpers/emails/email.js"
import { createLogger } from "../helpers/logger.js"
import { findDirectoryOpportunitiesForProduct } from "./find-directory-opportunities.js"
import { runReplyQueueForConfig } from "./run-reply-queue.js"

const log = createLogger("route-onboarding-complete")

const SEND_INDIVIDUAL_ONBOARDING_EMAILS = false

type ReplyQueueOnboardingResult = Awaited<
  ReturnType<typeof runReplyQueueForConfig>
>
type DirectoryOnboardingResult = Awaited<
  ReturnType<typeof findDirectoryOpportunitiesForProduct>
>

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
    const [replyQueueResult, directoryResult] = await Promise.allSettled([
      runReplyQueueForConfig({
        configId: replyQueueConfigId,
        userId,
        sendEmailAlerts: SEND_INDIVIDUAL_ONBOARDING_EMAILS,
      }),
      findDirectoryOpportunitiesForProduct(productId),
    ])

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

    await sendOnboardingSummaryEmail({
      userId,
      productId,
      replyQueueResult,
      directoryResult,
    })

    res.json({
      success: true,
      replyQueue:
        replyQueueResult.status === "fulfilled" ? replyQueueResult.value : null,
      directoryOpportunities:
        directoryResult.status === "fulfilled" ? directoryResult.value : null,
    })
  } catch (err) {
    log.error("unhandled onboarding jobs error", { error: String(err) })
    res.status(500).json({ error: "Failed to run onboarding jobs." })
  }
})
