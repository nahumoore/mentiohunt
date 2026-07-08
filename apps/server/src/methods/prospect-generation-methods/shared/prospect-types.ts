/**
 * Types shared by every prospect-generation method: the email personalization
 * settings passed in from product config, the payload each method reports
 * back through `onProspectCreated`, and the enrichment column shape each
 * method's per-prospect enrichment step writes to `backlink_prospects`.
 */

export type EmailSettings = {
  voice_tone?: string | null
  offering?: string | null
}

export type ProspectCreatedPayload = {
  id: string
  contactName: string | null
  emailSubject: string | null
  emailBody: string | null
  step2Body: string | null
  step3Body: string | null
}

export type EnrichedColumns = {
  contact_name: string | null
  contact_email: string | null
  contact_social_links: Record<string, string> | null
  email_subject: string | null
  email_body: string | null
  step2_body: string | null
  step3_body: string | null
  raw_metadata: unknown
}

export const EMPTY_ENRICHMENT: EnrichedColumns = {
  contact_name: null,
  contact_email: null,
  contact_social_links: null,
  email_subject: null,
  email_body: null,
  step2_body: null,
  step3_body: null,
  raw_metadata: null,
}
