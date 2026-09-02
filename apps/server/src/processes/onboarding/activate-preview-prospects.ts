import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json, Tables } from "@workspace/supabase/database-types"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { enrichContact } from "../../methods/prospect-generation-methods/competitor-backlink/enrich-contact.js"
import type { PageType } from "../../methods/prospect-generation-methods/competitor-backlink/score-backlink-relevance.js"
import {
  generateOutreachSequence,
  type OutreachContext,
} from "../../methods/prospect-generation-methods/shared/generate-outreach-sequence.js"
import {
  assignSequences,
  createSequencesForProspect,
} from "./prospect-sequences.js"
import { resolveEmailAccount } from "./resolve-email-account.js"

const log = createLogger("activate-preview-prospects")

type PreviewProspect = Pick<
  Tables<"backlink_prospects">,
  | "id"
  | "domain"
  | "found_url"
  | "target_url"
  | "tier"
  | "raw_metadata"
  | "enrichment_status"
>

type Product = Pick<
  Tables<"products">,
  | "id"
  | "user_id"
  | "product_name"
  | "product_description"
  | "website_url"
  | "competitors"
>

function asRecord(
  value: Json | undefined
): Record<string, Json | undefined> | null {
  return value !== null && typeof value === "object" && !Array.isArray(value)
    ? value
    : null
}

function storedOutreachContext(
  rawMetadata: Json | null
): OutreachContext | null {
  const metadata = asRecord(rawMetadata ?? undefined)
  const context = asRecord(metadata?.["outreach_context"])
  if (!context || typeof context["opportunityType"] !== "string") return null
  return context as unknown as OutreachContext
}

function normalizeCompetitorDomain(value: string | undefined): string {
  if (!value) return "another relevant product"
  try {
    return new URL(value.includes("://") ? value : `https://${value}`).hostname
  } catch {
    return value
  }
}

function fallbackOutreachContext(
  prospect: PreviewProspect,
  product: Product
): OutreachContext {
  const foundUrl = prospect.found_url ?? prospect.domain ?? product.website_url
  const title = prospect.domain ?? foundUrl
  const targetUrl = prospect.target_url ?? product.website_url

  if (prospect.tier === "unlinked_mention") {
    return { opportunityType: "unlinked_mention", title, foundUrl }
  }

  if (prospect.tier === "resource_page_inclusion") {
    return {
      opportunityType: "resource_page_inclusion",
      title,
      foundUrl,
      targetUrl,
      targetTitle: targetUrl,
      targetPageType: "resource",
      reason: "The selected page is relevant to this resource page's readers.",
    }
  }

  if (prospect.tier === "broken_link_building") {
    const metadata = asRecord(prospect.raw_metadata ?? undefined)
    const details = asRecord(metadata?.["broken_link_building"])
    const deadUrl =
      typeof details?.["deadUrl"] === "string" ? details["deadUrl"] : foundUrl
    const rawStatus = details?.["deadUrlStatus"]
    const deadUrlStatus =
      typeof rawStatus === "number" ||
      rawStatus === "soft_404" ||
      rawStatus === "redirected"
        ? rawStatus
        : 404
    return {
      opportunityType: "broken_link_building",
      title,
      foundUrl,
      deadUrl,
      deadUrlStatus,
      anchorText:
        typeof details?.["anchorText"] === "string"
          ? details["anchorText"]
          : null,
      targetUrl,
      targetTitle: targetUrl,
      matchReason: "This page is a relevant replacement for the dead link.",
    }
  }

  return {
    opportunityType:
      prospect.tier === "listicle_roundup"
        ? "listicle_roundup"
        : "competitor_backlink",
    title,
    anchor: "",
    pageType: prospect.tier === "listicle_roundup" ? "roundup" : "other",
    competitorDomain: normalizeCompetitorDomain(product.competitors?.[0]),
    competitorNamedInText: prospect.tier === "listicle_roundup",
  }
}

function contactPageType(tier: PreviewProspect["tier"]): PageType {
  if (tier === "listicle_roundup") return "roundup"
  if (tier === "resource_page_inclusion" || tier === "broken_link_building")
    return "resource"
  return "other"
}

/**
 * Continues a paid user's saved preview in place. Discovery already happened;
 * activation only resolves contacts, drafts outreach, and creates sequences for
 * the exact opportunities the user saw before checkout.
 */
export async function activatePreviewProspects(
  userId: string,
  productId: string
): Promise<void> {
  const [
    { data: product, error: productError },
    { data: preview, error: previewError },
  ] = await Promise.all([
    supabaseAdmin
      .from("products")
      .select(
        "id, user_id, product_name, product_description, website_url, competitors"
      )
      .eq("id", productId)
      .eq("user_id", userId)
      .single(),
    supabaseAdmin
      .from("onboarding_previews")
      .select("result_ids")
      .eq("product_id", productId)
      .eq("user_id", userId)
      .single(),
  ])

  if (productError || !product)
    throw new Error(productError?.message ?? "Preview product not found")
  if (previewError || !preview)
    throw new Error(previewError?.message ?? "Onboarding preview not found")

  const resultIds = Array.isArray(preview.result_ids)
    ? preview.result_ids.filter(
        (value): value is string => typeof value === "string"
      )
    : []
  if (resultIds.length === 0) {
    log.info("no preview prospects to activate", { userId, productId })
    return
  }

  const { data: prospects, error: prospectsError } = await supabaseAdmin
    .from("backlink_prospects")
    .select(
      "id, domain, found_url, target_url, tier, raw_metadata, enrichment_status"
    )
    .eq("product_id", productId)
    .in("id", resultIds)
    .in("enrichment_status", ["pending", "failed"])

  if (prospectsError) throw new Error(prospectsError.message)
  if (!prospects?.length) {
    await assignSequences(userId, productId)
    return
  }

  const [{ data: settings }, account] = await Promise.all([
    supabaseAdmin
      .from("backlink_prospects_settings")
      .select("voice_tone, offering")
      .eq("product_id", productId)
      .single(),
    resolveEmailAccount(userId),
  ])
  const limit = pLimit(5)

  await Promise.allSettled(
    (prospects as PreviewProspect[]).map((prospect) =>
      limit(async () => {
        if (!prospect.found_url || !prospect.domain) {
          log.warn("preview prospect missing contact target", {
            productId,
            prospectId: prospect.id,
          })
          return
        }

        const { data: claimed, error: claimError } = await supabaseAdmin
          .from("backlink_prospects")
          .update({ enrichment_status: "enriching" })
          .eq("id", prospect.id)
          .eq("product_id", productId)
          .in("enrichment_status", ["pending", "failed"])
          .select("id")
          .maybeSingle()
        if (claimError) throw new Error(claimError.message)
        if (!claimed) return

        try {
          const contact = await enrichContact(
            prospect.found_url,
            contactPageType(prospect.tier),
            prospect.domain
          )
          const context =
            storedOutreachContext(prospect.raw_metadata) ??
            fallbackOutreachContext(prospect, product)
          const draft = contact.email
            ? await generateOutreachSequence(product, context, {
                contactName: contact.name,
                senderName: account?.name ?? null,
                isPublicAccount: account?.isPublic ?? true,
                voiceTone: settings?.voice_tone,
                offering: settings?.offering,
                authorBio: contact.rawMetadata?.bio ?? null,
              })
            : null
          const contactReady = Boolean(contact.email && draft)
          const metadata = asRecord(prospect.raw_metadata ?? undefined) ?? {}
          const { error: updateError } = await supabaseAdmin
            .from("backlink_prospects")
            .update({
              contact_name: contact.name,
              contact_email: contact.email,
              contact_social_links:
                Object.keys(contact.social_links).length > 0
                  ? contact.social_links
                  : null,
              email_subject: draft?.subject ?? null,
              email_body: draft?.step1Body ?? null,
              raw_metadata: {
                ...metadata,
                ...(contact.rawMetadata ?? {}),
                outreach_context: context as unknown as Json,
              },
              enrichment_status: contactReady ? "ready" : "failed",
              status: contact.email ? "new" : "email_not_found",
            })
            .eq("id", prospect.id)
            .eq("enrichment_status", "enriching")
          if (updateError) throw new Error(updateError.message)

          if (contactReady && account && draft) {
            await createSequencesForProspect(
              {
                id: prospect.id,
                contactName: contact.name,
                emailSubject: draft.subject,
                emailBody: draft.step1Body,
                step2Body: draft.step2Body,
                step3Body: draft.step3Body,
              },
              account
            )
          }
        } catch (error) {
          await supabaseAdmin
            .from("backlink_prospects")
            .update({ enrichment_status: "failed" })
            .eq("id", prospect.id)
            .eq("enrichment_status", "enriching")
          log.warn("preview prospect activation failed", {
            productId,
            prospectId: prospect.id,
            error: String(error),
          })
        }
      })
    )
  )

  await assignSequences(userId, productId, account)
  log.success("preview activation complete", {
    userId,
    productId,
    prospects: prospects.length,
  })
}
