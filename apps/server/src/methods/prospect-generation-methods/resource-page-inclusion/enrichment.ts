import { createLogger } from "../../../helpers/logger.js"
import { enrichContact } from "../competitor-backlink/enrich-contact.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { EMPTY_ENRICHMENT, type EmailSettings, type EnrichedColumns } from "../shared/prospect-types.js"
import type { ScoredResourceInclusionCandidate } from "./score-resource-page-inclusion.js"
import type { Product } from "./types.js"

const log = createLogger("resource-page-inclusion-enrichment")

export { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"

export async function enrichResourceInclusion(
  item: ScoredResourceInclusionCandidate,
  product: Product,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  const outreachContext = {
    opportunityType: "resource_page_inclusion" as const,
    title: item.title,
    foundUrl: item.url,
    targetUrl: item.targetPage.url,
    targetTitle: item.targetPage.title ?? "",
    targetDescription: item.targetPage.description,
    targetPageType: item.targetPage.page_type,
    reason: item.relevanceReason,
  }

  try {
    const contact = await enrichContact(item.url, "resource", item.domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

    let emailResult: { subject: string; step1Body: string; step2Body: string; step3Body: string; cost: number } | null = null
    if (contact.email) {
      emailResult = await generateOutreachSequence(product, outreachContext, {
        contactName: contact.name,
        senderName: sender.name,
        isPublicAccount: sender.isPublicAccount,
        voiceTone: emailSettings.voice_tone,
        offering: emailSettings.offering,
        authorBio: contact.rawMetadata?.bio ?? null,
      })
    }

    return {
      contact_name: contact.name,
      contact_email: contact.email,
      contact_social_links: social,
      email_subject: emailResult?.subject ?? null,
      email_body: emailResult?.step1Body ?? null,
      step2_body: emailResult?.step2Body ?? null,
      step3_body: emailResult?.step3Body ?? null,
      raw_metadata: {
        ...(contact.rawMetadata ?? {}),
        outreach_context: outreachContext,
        resource_page_inclusion: {
          targetPageId: item.targetPage.id,
          targetPageType: item.targetPage.page_type,
          targetKeywords: item.targetPage.keywords,
          query: item.query,
          relevanceScore: item.relevanceScore,
          relevanceReason: item.relevanceReason,
          isCuratedResourcePage: item.isCuratedResourcePage,
        },
      },
    }
  } catch (err) {
    log.warn("resource inclusion enrichment failed", { domain: item.domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT, raw_metadata: { outreach_context: outreachContext } }
  }
}
