import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("generate-mention-email")

const MAX_USER_INPUT_LENGTH = 400

function sanitizeUserInput(input: string | null | undefined): string | null {
  if (!input) return null
  return input.trim().slice(0, MAX_USER_INPUT_LENGTH)
}

/**
 * Outreach email for an unlinked brand mention: the author already mentioned the
 * product, so the ask is simply to turn that existing mention into a link.
 */
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
): Promise<{ subject: string; body: string; cost: number } | null> {
  const greeting = context.contactName
    ? `Hi ${context.contactName.split(" ")[0]}`
    : "Hi there"

  const voiceTone = sanitizeUserInput(context.voiceTone)
  const offering = sanitizeUserInput(context.offering)

  const systemInstructions = `You write short, warm outreach emails from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
Page URL: ${context.foundUrl}
Situation: This page already mentions ${product.product_name} by name but does not link to it. You are asking the author to turn that existing mention into a link to ${product.website_url}.
Greeting: ${greeting}
${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>` : ""}${offering ? `\n<offering>\n${offering}\n</offering>` : ""}
Tone: casual, direct, founder-to-founder. Like tapping a fellow builder on the shoulder — not pitching a procurement team. Genuine, not salesy.

Write the email. Rules:
- Open with ${greeting},
- One sentence thanking them for mentioning ${product.product_name} in their page — make it feel real, reference the page naturally, not templated.
- One short, direct ask — would they mind linking the mention to ${product.website_url}.${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time — pick the most fitting option, don't list all of them." : ""}
- Sign off with "Best,\n${context.senderName ? context.senderName.split(" ")[0] : ""}" — use the real name, no placeholder.
- Total: 3-4 sentences. Tight and human.
- No em-dashes, no bullet points, no corporate language, no words like "complement", "leverage", "synergy", or "workflow".
- Do not mention "SEO", "backlink", or "domain authority".${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
      systemInstructions,
      input: "Draft the outreach email and subject line.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "mention_outreach_email",
          strict: true,
          schema: {
            type: "object",
            properties: {
              email_subject: { type: "string" },
              email_body: { type: "string" },
            },
            required: ["email_subject", "email_body"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as { email_subject: string; email_body: string }
    log.info("email generated", {
      foundUrl: context.foundUrl,
      subject: parsed.email_subject,
      cost_usd: cost.toFixed(4),
    })
    return { subject: parsed.email_subject, body: parsed.email_body, cost }
  } catch (err) {
    log.warn("email generation failed", { foundUrl: context.foundUrl, error: String(err) })
    return null
  }
}
