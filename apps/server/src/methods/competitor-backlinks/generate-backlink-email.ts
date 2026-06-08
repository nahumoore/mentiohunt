import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import type { PageType } from "./score-backlink-relevance.js"

const log = createLogger("generate-backlink-email")

const MAX_USER_INPUT_LENGTH = 400

function sanitizeUserInput(input: string | null | undefined): string | null {
  if (!input) return null
  return input.trim().slice(0, MAX_USER_INPUT_LENGTH)
}

function buildAngle(pageType: PageType, competitorDomain: string): string {
  switch (pageType) {
    case "roundup":
      return `The page is a roundup of tools. Pitch adding this product alongside ${competitorDomain}.`
    case "comparison":
      return `The page compares ${competitorDomain} with others. Offer to provide info or a trial to be included.`
    case "resource":
      return `The page is an educational resource that mentions ${competitorDomain}. Suggest adding this product as a useful addition for readers.`
    case "brand-mention":
      return `The page mentions ${competitorDomain}. Position this product as an alternative worth including.`
    default:
      return `The page links to ${competitorDomain}. Introduce this product as a relevant alternative.`
  }
}

export async function generateBacklinkEmail(
  product: { product_name: string; product_description: string; website_url: string },
  context: {
    title: string
    anchor: string
    urlToPath: string
    pageType: PageType
    contactName: string | null
    competitorDomain: string
    senderName: string | null
    voiceTone?: string | null
    offering?: string | null
  }
): Promise<{ subject: string; body: string; cost: number } | null> {
  const greeting = context.contactName
    ? `Hi ${context.contactName.split(" ")[0]}`
    : "Hi there"

  const angle = buildAngle(context.pageType, context.competitorDomain)
  const voiceTone = sanitizeUserInput(context.voiceTone)
  const offering = sanitizeUserInput(context.offering)

  const systemInstructions = `You write short, warm outreach emails from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
Anchor text used for competitor: ${context.anchor || "(unknown)"}
Outreach angle: ${angle}
Greeting: ${greeting}
${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>` : ""}${offering ? `\n<offering>\n${offering}\n</offering>` : ""}
Tone: casual, direct, founder-to-founder. Like tapping a fellow builder on the shoulder — not pitching a procurement team. Genuine, not salesy.

Write the email. Rules:
- Open with ${greeting},
- One sentence showing you noticed their page — make it feel real, not templated.
- One sentence on why this product belongs alongside ${context.competitorDomain} — specific, no buzzwords.${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time — pick the most fitting option, don't list all of them." : ""}
- One short, direct ask — inclusion, mention, or link.
- Sign off with "Best,\n${context.senderName ? context.senderName.split(" ")[0] : ""}" — use the real name, no placeholder.
- Total: 3-4 sentences. Tight and human.
- No em-dashes, no bullet points, no corporate language, no words like "complement", "leverage", "synergy", or "workflow".
- Do not mention "SEO" or "domain authority".${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
      systemInstructions,
      input: "Draft the outreach email and subject line.",
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "backlink_outreach_email",
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
      pageType: context.pageType,
      competitor: context.competitorDomain,
      subject: parsed.email_subject,
      cost_usd: cost.toFixed(4),
    })
    return { subject: parsed.email_subject, body: parsed.email_body, cost }
  } catch (err) {
    log.warn("email generation failed", {
      pageType: context.pageType,
      competitor: context.competitorDomain,
      error: String(err),
    })
    return null
  }
}
