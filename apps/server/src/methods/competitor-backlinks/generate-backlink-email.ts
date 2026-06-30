import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import type { PageType } from "./score-backlink-relevance.js"
import { sanitizeContactName } from "./contact-validation.js"

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
): Promise<{ subject: string; step1Body: string; step2Body: string; step3Body: string; cost: number } | null> {
  const cleanContactName = sanitizeContactName(context.contactName)
  const greeting = cleanContactName
    ? `Hi ${cleanContactName.split(" ")[0]}`
    : "Hi there"
  const senderFirstName = context.senderName?.split(" ")[0] ?? ""

  const angle = buildAngle(context.pageType, context.competitorDomain)
  const voiceTone = sanitizeUserInput(context.voiceTone)
  const offering = sanitizeUserInput(context.offering)

  const systemInstructions = `You write a 3-email outreach sequence from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
Anchor text used for competitor: ${context.anchor || "(unknown)"}
Outreach angle: ${angle}
${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>\n` : ""}${offering ? `\n<offering>\n${offering}\n</offering>\n` : ""}
Generate all 3 emails. Rules that apply to all:
- Open each email with: ${greeting},
- Separate each paragraph with a blank line.
- No "just following up", "circling back", "touching base", "checking in"
- No em-dashes, no bullet points, no corporate language
- No "SEO", "domain authority", "complement", "leverage", "synergy", "workflow"
- Sign off each email with "Best,\\n${senderFirstName}"
- Do not invent offers, benefits, or claims not stated in the offering field above.${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}

Email 1 — first contact. Tone: casual, direct, like tapping a fellow builder on the shoulder.
- One sentence showing you noticed their specific page — make it feel real, not templated.
- One sentence on why this product belongs alongside ${context.competitorDomain} — specific, no buzzwords.${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time — pick the most fitting option, don't list all of them." : ""}
- One short, direct ask — inclusion, mention, or link.
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
          name: "backlink_outreach_sequence",
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
      pageType: context.pageType,
      competitor: context.competitorDomain,
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
    log.warn("email generation failed", {
      pageType: context.pageType,
      competitor: context.competitorDomain,
      error: String(err),
    })
    return null
  }
}
