import { createLogger } from "../../../helpers/logger.js"
import { enrichContact } from "../competitor-backlink/enrich-contact.js"
import { extractCompetitorDomain } from "../competitor-backlink/extract-backlinks.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { EMPTY_ENRICHMENT, type EmailSettings, type EnrichedColumns } from "../shared/prospect-types.js"
import type { ListicleCandidate } from "./score-listicle-relevance.js"

const log = createLogger("listicle-roundup-enrichment")

export type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  competitors?: string[] | null
  target_keywords?: string[] | null
}

export type QualifiedListicle = ListicleCandidate & {
  domain: string
  relevanceScore: number
  relevanceReason: string
  topCompetitor: string | null
  domainRating: number | null
}

/**
 * Resolve contact + email draft for a listicle prospect. Returns the columns
 * to persist as an update against the already-inserted bare prospect row.
 */
export async function enrichListicle(
  item: QualifiedListicle,
  product: Product,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  try {
    const contact = await enrichContact(item.url, "roundup", item.domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

    const competitorDomain =
      item.topCompetitor ||
      (product.competitors?.[0] ? extractCompetitorDomain(product.competitors[0]) : "similar tools")

    if (!contact.email) {
      log.info("contact name without email", { domain: item.domain, contactName: contact.name })
      return {
        contact_name: contact.name,
        contact_email: null,
        contact_social_links: social,
        email_subject: null,
        email_body: null,
        step2_body: null,
        step3_body: null,
        raw_metadata: {
          ...(contact.rawMetadata ?? {}),
          outreach_context: {
            opportunityType: "listicle_roundup",
            title: item.title,
            anchor: "",
            pageType: "roundup",
            competitorDomain,
          },
        },
      }
    }

    const emailResult = await generateOutreachSequence(
      product,
      {
        opportunityType: "listicle_roundup",
        title: item.title,
        anchor: "",
        pageType: "roundup",
        competitorDomain,
      },
      {
        contactName: contact.name,
        senderName: sender.name,
        isPublicAccount: sender.isPublicAccount,
        voiceTone: emailSettings.voice_tone,
        offering: emailSettings.offering,
        authorBio: contact.rawMetadata?.bio ?? null,
      }
    )

    log.success("enrichment complete", {
      domain: item.domain,
      contactConfidence: contact.confidence,
      hasEmailDraft: !!emailResult,
    })

    return {
      contact_name: contact.name,
      contact_email: contact.email,
      contact_social_links: social,
      email_subject: emailResult?.subject ?? null,
      email_body: emailResult?.step1Body ?? null,
      step2_body: emailResult?.step2Body ?? null,
      step3_body: emailResult?.step3Body ?? null,
      raw_metadata: contact.rawMetadata,
    }
  } catch (err) {
    log.warn("listicle enrichment failed", { domain: item.domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT }
  }
}
