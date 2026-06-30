import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { sanitizeContactName } from "../competitor-backlinks/contact-validation.js"

const log = createLogger("generate-mention-email")

const MAX_USER_INPUT_LENGTH = 400

function sanitizeUserInput(input: string | null | undefined): string | null {
  if (!input) return null
  return input.trim().slice(0, MAX_USER_INPUT_LENGTH)
}

export async function generateMentionEmail(
  product: { product_name: string; product_description: string; website_url: string },
  context: {
    title: string
    foundUrl: string
    contactName: string | null
    senderName: string | null
    voiceTone?: string | null
    offering?: string | null
  }
): Promise<{ subject: string; step1Body: string; step2Body: string; step3Body: string; cost: number } | null> {
  const cleanContactName = sanitizeContactName(context.contactName)
  const greeting = cleanContactName
    ? `Hi ${cleanContactName.split(" ")[0]}`
    : "Hi there"
  const senderFirstName = context.senderName?.split(" ")[0] ?? ""

  const voiceTone = sanitizeUserInput(context.voiceTone)
  const offering = sanitizeUserInput(context.offering)

  const systemInstructions = `You write a 3-email outreach sequence from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
Page URL: ${context.foundUrl}
Situation: This page already mentions ${product.product_name} by name but does not link to it. The ask is to turn that existing mention into a link to ${product.website_url}.
${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>\n` : ""}${offering ? `\n<offering>\n${offering}\n</offering>\n` : ""}
Generate all 3 emails. Rules that apply to all:
- Open each email with: ${greeting},
- Separate each paragraph with a blank line.
- No "just following up", "circling back", "touching base", "checking in"
- No em-dashes, no bullet points, no corporate language
- No "SEO", "backlink", "domain authority", "complement", "leverage", "synergy", "workflow"
- Sign off each email with "Best,\\n${senderFirstName}"
- Do not invent offers, benefits, or claims not stated in the offering field above.${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}

Email 1 — first contact. Tone: casual, direct, like tapping a fellow builder on the shoulder.
- One sentence thanking them for mentioning ${product.product_name} — reference the page naturally, not templated.${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time — pick the most fitting option, don't list all of them." : ""}
- One short, direct ask — would they mind linking the mention to ${product.website_url}.
- 3–4 sentences total.

Email 2 — follow-up:
- Do not reference when email 1 was sent (no "last week", "a few days ago", "recently", or any time reference).
- Do not open with "just following up" or any variant.
- Reframe from a different angle than email 1 — different outcome, use case, or social proof. Stay within what the offering states.
- 3–4 sentences total.

Email 3 — final outreach:
- Do not reference when previous emails were sent.
- Make clear this is the last outreach, warmly.
- Use the most compelling angle not yet covered.
- End with a genuine goodbye, e.g. "No hard feelings if timing isn't right — I won't follow up after this."
- After the sign-off, add a P.S. line reinforcing the goodbye.`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
      systemInstructions,
      input: "Draft the outreach subject line and all 3 emails.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "mention_outreach_sequence",
          strict: true,
          schema: {
            type: "object",
            properties: {
              email_subject: { type: "string" },
              step1_body: { type: "string" },
              step2_body: { type: "string" },
              step3_body: { type: "string" },
            },
            required: ["email_subject", "step1_body", "step2_body", "step3_body"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as {
      email_subject: string
      step1_body: string
      step2_body: string
      step3_body: string
    }
    log.info("email generated", {
      foundUrl: context.foundUrl,
      subject: parsed.email_subject,
      cost_usd: cost.toFixed(4),
    })
    return {
      subject: parsed.email_subject,
      step1Body: parsed.step1_body,
      step2Body: parsed.step2_body,
      step3Body: parsed.step3_body,
      cost,
    }
  } catch (err) {
    log.warn("email generation failed", { foundUrl: context.foundUrl, error: String(err) })
    return null
  }
}
