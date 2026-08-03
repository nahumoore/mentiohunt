import { createLogger } from "../../../helpers/logger.js"
import { enrichContact } from "../competitor-backlink/enrich-contact.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { EMPTY_ENRICHMENT, type EmailSettings, type EnrichedColumns } from "../shared/prospect-types.js"
import type { SubmittedUrlItem, TargetPageChoice } from "./types.js"

const log = createLogger("user-submitted-enrichment")

export { enrichDomainRatings } from "../shared/enrich-domain-ratings.js"

export async function enrichUserSubmitted(
  item: SubmittedUrlItem,
  targetChoice: TargetPageChoice,
  product: { product_name: string; product_description: string; website_url: string },
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  const outreachContext = {
    opportunityType: "user_submitted" as const,
    title: item.article.title,
    foundUrl: item.url,
    targetUrl: targetChoice.page.url,
    targetTitle: targetChoice.page.title ?? "",
    targetDescription: targetChoice.page.description,
    targetPageType: targetChoice.page.page_type,
    reason: targetChoice.reason,
  }

  try {
    const contact = await enrichContact(item.url, "other", item.domain)
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
        user_submitted: {
          targetPageId: targetChoice.page.id,
          targetPageType: targetChoice.page.page_type,
          fitScore: targetChoice.score,
          fitReason: targetChoice.reason,
        },
      },
    }
  } catch (err) {
    log.warn("user-submitted enrichment failed", { domain: item.domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT, raw_metadata: { outreach_context: outreachContext } }
  }
}
