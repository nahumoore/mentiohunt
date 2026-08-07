import { createLogger } from "../../../helpers/logger.js"
import { enrichContact } from "../competitor-backlink/enrich-contact.js"
import { generateOutreachSequence } from "../shared/generate-outreach-sequence.js"
import { EMPTY_ENRICHMENT, type EmailSettings, type EnrichedColumns } from "../shared/prospect-types.js"
import type { MatchedDeadLinkCandidate } from "./types.js"

const log = createLogger("broken-link-building-enrichment")

export async function enrichBrokenLinkProspect(
  item: MatchedDeadLinkCandidate,
  product: { product_name: string; product_description: string; website_url: string },
  domain: string,
  sender: { name: string | null; isPublicAccount: boolean },
  emailSettings: EmailSettings
): Promise<EnrichedColumns> {
  const outreachContext = {
    opportunityType: "broken_link_building" as const,
    title: item.title,
    foundUrl: item.urlFrom,
    deadUrl: item.deadUrl,
    deadUrlStatus: item.deadUrlStatus,
    anchorText: item.anchor || null,
    targetUrl: item.targetUrl,
    targetTitle: item.targetTitle,
    matchReason: item.matchReason,
  }

  try {
    // "resource" is the closest page-type bucket enrichContact understands
    // (it only special-cases "other" + a media-site domain heuristic) —
    // a dead-link linking page is functionally a resource/guide page.
    const contact = await enrichContact(item.urlFrom, "resource", domain)
    const social = Object.keys(contact.social_links).length > 0 ? contact.social_links : null

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
        raw_metadata: { ...(contact.rawMetadata ?? {}), outreach_context: outreachContext },
      }
    }

    const emailResult = await generateOutreachSequence(product, outreachContext, {
      contactName: contact.name,
      senderName: sender.name,
      isPublicAccount: sender.isPublicAccount,
      voiceTone: emailSettings.voice_tone,
      offering: emailSettings.offering,
      authorBio: contact.rawMetadata?.bio ?? null,
    })

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
      raw_metadata: { ...(contact.rawMetadata ?? {}), outreach_context: outreachContext },
    }
  } catch (err) {
    log.warn("prospect enrichment failed", { domain, error: String(err) })
    return { ...EMPTY_ENRICHMENT, raw_metadata: { outreach_context: outreachContext } }
  }
}
