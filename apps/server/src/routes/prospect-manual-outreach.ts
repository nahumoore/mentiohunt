import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { createSequencesForProspect } from "../processes/onboarding/prospect-sequences.js"
import { resolveEmailAccount } from "../processes/onboarding/resolve-email-account.js"
import { resolveSenderName } from "../methods/shared/resolve-sender-name.js"
import {
  generateOutreachSequence,
  type OutreachContext,
} from "../methods/shared/generate-outreach-sequence.js"
import type { PageType } from "../methods/competitor-backlinks/score-backlink-relevance.js"

const log = createLogger("route-prospect-manual-outreach")

export const prospectManualOutreachRouter: IRouter = Router()

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

function readBodyString(body: unknown, key: string): string {
  if (body === null || typeof body !== "object") return ""
  const value = (body as Record<string, unknown>)[key]
  return typeof value === "string" ? value.trim() : ""
}

type StoredOutreachContext =
  | {
      opportunityType: "competitor_backlink" | "listicle_roundup"
      title: string
      anchor: string
      pageType: PageType
      competitorDomain: string
    }
  | {
      opportunityType: "unlinked_mention"
      title: string
      foundUrl: string
    }
  | {
      opportunityType: "resource_page_inclusion"
      title: string
      foundUrl: string
      targetUrl: string
      targetTitle: string
      targetDescription?: string | null
      targetPageType: string
      reason: string
    }

/** Rebuild the OutreachContext used to generate the original draft. Prefers the
 * context persisted at discovery time (raw_metadata.outreach_context); falls
 * back to a minimal context derived from the row for legacy prospects that
 * predate that persistence. */
function buildOutreachContext(prospect: {
  tier: "competitor_backlink" | "unlinked_mention" | "listicle_roundup" | "resource_page_inclusion"
  domain: string | null
  target_url: string | null
  found_url: string | null
  raw_metadata: unknown
}): OutreachContext {
  const raw =
    prospect.raw_metadata !== null && typeof prospect.raw_metadata === "object"
      ? (prospect.raw_metadata as Record<string, unknown>)
      : null
  const stored = raw?.outreach_context as StoredOutreachContext | undefined

  if (stored?.opportunityType === prospect.tier) {
    return stored as OutreachContext
  }

  if (prospect.tier === "unlinked_mention") {
    return {
      opportunityType: "unlinked_mention",
      title: prospect.domain ?? "",
      foundUrl: prospect.found_url ?? "",
    }
  }

  if (prospect.tier === "resource_page_inclusion") {
    return {
      opportunityType: "resource_page_inclusion",
      title: prospect.domain ?? "",
      foundUrl: prospect.found_url ?? "",
      targetUrl: prospect.target_url ?? "",
      targetTitle: "",
      targetPageType: "resource",
      reason: "The target page may be a useful additional resource for this page's readers.",
    }
  }

  return {
    opportunityType: prospect.tier,
    title: prospect.domain ?? "",
    anchor: "",
    pageType: "other",
    competitorDomain: prospect.domain ?? "",
  }
}

prospectManualOutreachRouter.post("/prospects/manual-outreach", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const userId = readBodyString(req.body, "userId")
  const productId = readBodyString(req.body, "productId")
  const prospectId = readBodyString(req.body, "prospectId")

  if (!userId || !productId || !prospectId) {
    res.status(400).json({ error: "userId, productId and prospectId are required" })
    return
  }

  await withRouteLog(`prospect-manual-outreach-${prospectId}`, async () => {
    const account = await resolveEmailAccount(userId)
    if (!account) {
      log.warn("no email account available", { userId, prospectId })
      res.status(409).json({ error: "No email account connected." })
      return
    }

    const { data: prospect, error: prospectError } = await supabaseAdmin
      .from("backlink_prospects")
      .select(
        "id, product_id, tier, status, domain, target_url, found_url, contact_name, contact_email, raw_metadata"
      )
      .eq("id", prospectId)
      .eq("product_id", productId)
      .maybeSingle()

    if (prospectError || !prospect) {
      log.error("prospect not found", { prospectId, error: prospectError?.message })
      res.status(404).json({ error: "Prospect not found." })
      return
    }

    if (prospect.status !== "email_not_found") {
      res.status(400).json({ error: "Prospect is not awaiting manual completion." })
      return
    }

    if (!prospect.contact_email) {
      res.status(400).json({ error: "Contact email is required before generating outreach." })
      return
    }

    const { data: product, error: productError } = await supabaseAdmin
      .from("products")
      .select("product_name, product_description, website_url")
      .eq("id", productId)
      .single()

    if (productError || !product) {
      log.error("product not found", { productId, error: productError?.message })
      res.status(404).json({ error: "Product not found." })
      return
    }

    const { data: settings } = await supabaseAdmin
      .from("backlink_prospects_settings")
      .select("voice_tone, offering")
      .eq("product_id", productId)
      .maybeSingle()

    const sender = await resolveSenderName(userId)
    const context = buildOutreachContext(prospect)

    const emailResult = await generateOutreachSequence(product, context, {
      contactName: prospect.contact_name,
      senderName: sender.name,
      isPublicAccount: sender.isPublicAccount,
      voiceTone: settings?.voice_tone ?? null,
      offering: settings?.offering ?? null,
      authorBio: null,
    })

    if (!emailResult) {
      log.warn("outreach generation failed", { prospectId })
      res.status(502).json({ error: "Failed to generate outreach. Please try again." })
      return
    }

    const { error: updateError } = await supabaseAdmin
      .from("backlink_prospects")
      .update({
        email_subject: emailResult.subject,
        email_body: emailResult.step1Body,
        enrichment_status: "ready",
        status: "new",
      })
      .eq("id", prospectId)

    if (updateError) {
      log.error("failed to update prospect", { prospectId, error: updateError.message })
      res.status(500).json({ error: "Failed to save generated outreach." })
      return
    }

    await createSequencesForProspect(
      {
        id: prospectId,
        contactName: prospect.contact_name,
        emailSubject: emailResult.subject,
        emailBody: emailResult.step1Body,
        step2Body: emailResult.step2Body,
        step3Body: emailResult.step3Body,
      },
      account
    )

    log.success("manual outreach generated", { prospectId })
    res.json({ ok: true })
  })
})
