import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("generate-followup-emails")

const MAX_INPUT_LENGTH = 400

function cap(s: string | null | undefined): string | null {
  if (!s) return null
  return s.trim().slice(0, MAX_INPUT_LENGTH)
}

export async function generateFollowupEmails(context: {
  productName: string
  productDescription: string
  websiteUrl: string
  contactName: string | null
  step1Body: string
  offering: string | null
  voiceTone: string | null
}): Promise<{ step2Body: string; step3Body: string; cost: number } | null> {
  const offering = cap(context.offering)
  const voiceTone = cap(context.voiceTone)
  const firstName = context.contactName?.split(" ")[0] ?? null
  const greeting = firstName ? `Hi ${firstName},` : "Hi there,"

  const systemInstructions = `You write short, warm follow-up outreach emails from one founder to another.

The prospect already received email #1 (shown below). Write emails #2 and #3 — each must offer something genuinely different from the previous one.

Product: ${context.productName}
Description: ${context.productDescription}
Website: ${context.websiteUrl}

Original email sent (step 1):
---
${context.step1Body}
---
${offering ? `\nWhat you're offering: ${offering}` : ""}
${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>` : ""}

Write both follow-up emails. Rules that apply to both:
- Open with: ${greeting}
- No "just following up", "circling back", "touching base", "checking in"
- No em-dashes, no bullet points, no corporate language
- No "SEO", "backlink", "domain authority", "complement", "leverage", "synergy"
- Casual, founder-to-founder. 3–4 sentences max.
- Sign off: "Best,\\nNico"
${voiceTone ? "- Match the tone from <voice_tone>." : ""}

Email #2 rules:
- Acknowledge you already wrote once.
- Offer a different benefit or angle than step 1 — if step 1 pitched X from the offering, pitch Y now. If the offering is a single thing, reframe from a different angle (social proof, a specific outcome, a use case, etc).

Email #3 rules:
- This is the final email — make that clear, but warmly.
- Offer the most compelling option not yet pitched.
- End with a genuine goodbye. Something like: "No hard feelings if timing isn't right — I won't follow up after this."
- After the sign-off, add a P.S. line reinforcing the goodbye.`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.Z_AI_GLM_5,
      systemInstructions,
      input: "Draft follow-up email #2 and email #3.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "followup_emails",
          strict: true,
          schema: {
            type: "object",
            properties: {
              step2_body: { type: "string" },
              step3_body: { type: "string" },
            },
            required: ["step2_body", "step3_body"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as { step2_body: string; step3_body: string }
    log.info("followup emails generated", { cost_usd: cost.toFixed(4) })
    return { step2Body: parsed.step2_body, step3Body: parsed.step3_body, cost }
  } catch (err) {
    log.warn("followup email generation failed", { error: String(err) })
    return null
  }
}
