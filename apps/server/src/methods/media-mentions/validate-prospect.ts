import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("media-mentions-validate-prospect")

export interface ProspectDraft {
  mentionId: string
  rawText: string
  domain: string | null
  email: string | null
  actionType: "email_outreach" | "social_media"
  authorName: string | null
}

export interface ValidationResult {
  valid: boolean
  domain: string | null
  email: string | null
  actionType: "email_outreach" | "social_media"
  reason: string
}

const SYSTEM = `You are a data quality checker for media mention prospects.

Given a raw post and the fields extracted from it, verify that each field is explicitly supported by the post text. Apply corrections where needed.

Rules:
- domain: must come from a URL, bare domain, or email in the post. If the domain was inferred from brand names or location words, set to null.
- email: must appear verbatim in the post. If absent, set to null.
- action_type: must be "email_outreach" if a real email is present and confirmed, otherwise "social_media".
- valid: set false only if the post contains no actionable contact point at all (no email, no domain, no way to reach the author). A social_media prospect with no email is still valid.`

export async function validateProspect(draft: ProspectDraft): Promise<ValidationResult | null> {
  const input = JSON.stringify({
    raw_text: draft.rawText,
    extracted_domain: draft.domain,
    extracted_email: draft.email,
    extracted_action_type: draft.actionType,
    author_name: draft.authorName,
  })

  try {
    const { text } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE,
      systemInstructions: SYSTEM,
      input,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "prospect_validation",
          strict: true,
          schema: {
            type: "object",
            properties: {
              valid: { type: "boolean" },
              domain: { type: ["string", "null"] },
              email: { type: ["string", "null"] },
              action_type: { type: "string", enum: ["email_outreach", "social_media"] },
              reason: { type: "string" },
            },
            required: ["valid", "domain", "email", "action_type", "reason"],
            additionalProperties: false,
          },
        },
      },
    })

    let parsed: { valid: boolean; domain: string | null; email: string | null; action_type: string; reason: string }
    try {
      parsed = JSON.parse(text) as typeof parsed
    } catch {
      log.warn("validation json parse failed", { mentionId: draft.mentionId, rawText: text })
      return null
    }

    return {
      valid: parsed.valid,
      domain: parsed.domain,
      email: parsed.email,
      actionType: parsed.action_type as "email_outreach" | "social_media",
      reason: parsed.reason,
    }
  } catch (err) {
    log.warn("validation call failed", { mentionId: draft.mentionId, error: String(err) })
    return null
  }
}
