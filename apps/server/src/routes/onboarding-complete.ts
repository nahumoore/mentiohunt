import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { sendOnboardingCompleteEmail } from "../helpers/emails/send-onboarding-complete.js"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { discoverCompetitorBacklinks } from "../methods/competitor-backlinks/discover-competitor-backlinks.js"
import { generateFollowupEmails } from "../methods/email-sequences/generate-followup-emails.js"
import { crawlProductPages } from "../methods/product-pages/crawl-product-pages.js"
import { discoverUnlinkedMentions } from "../methods/unlinked-mentions/discover-unlinked-mentions.js"

const log = createLogger("route-onboarding-complete")

// Light cap for the first (onboarding) discovery run — keep it fast and cheap.
// Daily jobs call the discovery methods without limits (full defaults).
const ONBOARDING_BACKLINK_LIMITS = { maxCompetitors: 2, maxProspects: 10 }
const ONBOARDING_MENTION_LIMITS = { maxCandidates: 12, maxProspects: 10 }

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
  backlinkDiscoveryResult,
  pagesResult,
}: {
  userId: string
  productId: string
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

async function resolveEmailAccount(userId: string): Promise<{ id: string } | null> {
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("tier")
    .eq("id", userId)
    .single()

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"

  if (isPaid) {
    const { data: userAccount } = await supabaseAdmin
      .from("email_accounts")
      .select("id")
      .eq("user_id", userId)
      .eq("is_public", false)
      .eq("status", "active")
      .limit(1)
      .single()

    if (userAccount) return userAccount
  }

  const { data: publicAccount } = await supabaseAdmin
    .from("email_accounts")
    .select("id")
    .eq("is_public", true)
    .single()

  return publicAccount ?? null
}

async function assignSequences(
  userId: string,
  productId: string,
  productContext: { productName: string; productDescription: string; websiteUrl: string },
  emailSettings: { offering: string | null; voiceTone: string | null }
): Promise<void> {
  const account = await resolveEmailAccount(userId)

  if (!account) {
    log.warn("assignSequences: no email account available, skipping", { userId, productId })
    return
  }

  const { data: prospects } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, contact_name, email_subject, email_body")
    .eq("product_id", productId)
    .is("email_account_id", null)

  if (!prospects?.length) {
    log.info("assignSequences: no unassigned prospects", { productId })
    return
  }

  log.info("assignSequences START", { productId, count: prospects.length, accountId: account.id })

  const now = new Date()
  const hour1 = new Date(now.getTime() + 60 * 60 * 1000)
  const day3 = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)
  const day7 = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const followupResults = await Promise.all(
    prospects.map((p) =>
      generateFollowupEmails({
        productName: productContext.productName,
        productDescription: productContext.productDescription,
        websiteUrl: productContext.websiteUrl,
        contactName: p.contact_name,
        step1Body: p.email_body ?? "",
        offering: emailSettings.offering,
        voiceTone: emailSettings.voiceTone,
      })
    )
  )

  const sequences = prospects.flatMap((p, i) => {
    const reSubject = p.email_subject ? `Re: ${p.email_subject}` : null
    const followups = followupResults[i]
    const firstName = p.contact_name?.split(" ")[0] ?? "there"

    const step2Body =
      followups?.step2Body ??
      `Hi ${firstName},\n\nWanted to reach out once more — happy to share more details if helpful.\n\nBest,\nNico`

    const step3Body =
      followups?.step3Body ??
      `Hi ${firstName},\n\nLast note from me — if timing ever works out, I'd love to connect.\n\nBest,\nNico\n\nP.S. No hard feelings if it's not a fit — I won't follow up after this.`

    return [
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 1,
        subject: p.email_subject,
        body: p.email_body,
        scheduled_at: hour1.toISOString(),
      },
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 2,
        subject: reSubject,
        body: step2Body,
        scheduled_at: day3.toISOString(),
      },
      {
        prospect_id: p.id,
        email_account_id: account.id,
        step: 3,
        subject: reSubject,
        body: step3Body,
        scheduled_at: day7.toISOString(),
      },
    ]
  })

  const { error: seqError } = await supabaseAdmin
    .from("prospect_sequences")
    .insert(sequences)

  if (seqError) {
    log.error("assignSequences: failed to insert sequences", { productId, error: seqError.message })
    return
  }

  const { error: updateError } = await supabaseAdmin
    .from("backlink_prospects")
    .update({ email_account_id: account.id })
    .eq("product_id", productId)
    .is("email_account_id", null)

  if (updateError) {
    log.error("assignSequences: failed to update prospects", { productId, error: updateError.message })
    return
  }

  log.success("assignSequences done", { productId, sequences: sequences.length })
}

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
          backlinks: "running",
          pages: "running",
          started_at: new Date().toISOString(),
          total: 2,
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

    const [backlinkDiscoveryResult, mentionDiscoveryResult, pagesResult] = await Promise.allSettled([
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

    await assignSequences(
      userId,
      productId,
      {
        productName: product?.product_name ?? "",
        productDescription: product?.product_description ?? "",
        websiteUrl: product?.website_url ?? "",
      },
      { offering: emailSettings.offering, voiceTone: emailSettings.voice_tone }
    )

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
      backlinkDiscoveryResult: combinedBacklinkResult,
      pagesResult,
    })
  } catch (err) {
    log.error("unhandled onboarding jobs error", { error: String(err) })
    throw err
  }
}
