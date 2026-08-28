import { createLogger } from "../../../helpers/logger.js"
import { resolveContactEmail } from "../competitor-backlink/enrich-contact.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import type { EmailSettings, EnrichedColumns } from "../shared/prospect-types.js"
import type { CheckMentionResult } from "./check-mention-client.js"
import type { MentionCandidate } from "./score-mention-relevance.js"

const log = createLogger("unlinked-mention-enrichment")

export type Product = {
  id: string
  user_id: string
  product_name: string
  product_description: string
  website_url: string
  target_keywords?: string[] | null
}

export type QualifiedMention = MentionCandidate & {
  domain: string
  contact: CheckMentionResult["contact"]
  domainRating: number | null
}

/**
 * Resolve contact + email draft for a mention. Returns the columns to persist
 * as an update against the already-inserted bare prospect row.
 */
export async function enrichMention(
  candidate: QualifiedMention,
  product: Product,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  try {
    const contact = candidate.contact
      ? await resolveContactEmail(candidate.contact, candidate.domain)
      : { name: null, email: null, social_links: {}, confidence: "none" as const, rawMetadata: null }

    let emailResult: { subject: string; step1Body: string; step2Body: string; step3Body: string; cost: number } | null = null
    if (contact.email) {
      emailResult = await generateOutreachSequence(
        product,
        {
          opportunityType: "unlinked_mention",
          title: candidate.title,
          foundUrl: candidate.url,
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
    }

    log.success("enrichment complete", {
      domain: candidate.domain,
      hasEmail: !!contact.email,
      hasEmailDraft: !!emailResult,
    })

    return {
      contact_name: contact.name,
      contact_email: contact.email,
      contact_social_links:
        Object.keys(contact.social_links).length > 0 ? contact.social_links : null,
      email_subject: emailResult?.subject ?? null,
      email_body: emailResult?.step1Body ?? null,
      step2_body: emailResult?.step2Body ?? null,
      step3_body: emailResult?.step3Body ?? null,
      raw_metadata: {
        ...(contact.rawMetadata ?? {}),
        outreach_context: {
          opportunityType: "unlinked_mention",
          title: candidate.title,
          foundUrl: candidate.url,
        },
      },
    }
  } catch (err) {
    log.warn("mention enrichment failed", { domain: candidate.domain, error: String(err) })
    throw err
  }
}
