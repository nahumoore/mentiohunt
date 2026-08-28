import { createLogger } from "../../../helpers/logger.js"
import { competitorNamedInVisibleText } from "../shared/brand-mention.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import type { EmailSettings, EnrichedColumns } from "../shared/prospect-types.js"
import { enrichContact } from "./enrich-contact.js"
import type { ScoredBacklinkItem } from "./score-backlink-relevance.js"

const log = createLogger("competitor-backlink-enrichment")

/**
 * Resolve contact + email draft for a prospect. Returns the columns to persist
 * as an update against the already-inserted bare prospect row.
 */
export async function enrichProspect(
  item: ScoredBacklinkItem,
  product: { product_name: string; product_description: string; website_url: string },
  domain: string,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  try {
    const contact = await enrichContact(item.urlFrom, item.pageType, domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

    const competitorNamedInText = competitorNamedInVisibleText(item.competitorDomain, [
      item.anchor,
      item.title,
      item.textPre,
      item.textPost,
    ])
    const outreachContext = {
      opportunityType: "competitor_backlink" as const,
      title: item.title,
      anchor: item.anchor,
      pageType: item.pageType,
      competitorDomain: item.competitorDomain,
      competitorNamedInText,
    }

    if (!contact.email) {
      log.info("contact name without email", { domain, contactName: contact.name })
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
          outreach_context: outreachContext,
        },
      }
    }

    const emailResult = await generateOutreachSequence(
      product,
      outreachContext,
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
      domain,
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
      raw_metadata: {
        ...(contact.rawMetadata ?? {}),
        outreach_context: outreachContext,
      },
    }
  } catch (err) {
    log.warn("prospect enrichment failed", { domain, error: String(err) })
    throw err
  }
}
