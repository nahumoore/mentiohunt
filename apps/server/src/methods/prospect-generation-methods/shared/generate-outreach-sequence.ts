import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { sanitizeContactName } from "../competitor-backlink/contact-validation.js"
import type { PageType } from "../competitor-backlink/score-backlink-relevance.js"

const log = createLogger("generate-outreach-sequence")

const MAX_USER_INPUT_LENGTH = 400

export type OpportunityType = "competitor_backlink" | "unlinked_mention" | "listicle_roundup" | "resource_page_inclusion"

export type OutreachContext =
  | {
      opportunityType: "competitor_backlink" | "listicle_roundup"
      title: string
      anchor: string
      pageType: PageType
      competitorDomain: string
    }
  | {
      opportunityType: "unlinked_mention"
      title: string
      foundUrl: string
    }
  | {
      opportunityType: "resource_page_inclusion"
      title: string
      foundUrl: string
      targetUrl: string
      targetTitle: string
      targetDescription?: string | null
      targetPageType: string
      reason: string
    }

export type OutreachSender = {
  contactName: string | null
  senderName: string | null
  isPublicAccount: boolean
  voiceTone?: string | null
  offering?: string | null
  /** Scraped author bio (enrich-contact's rawMetadata.bio), if any — used for a
   * researched-not-templated P.S., never fabricated when absent. */
  authorBio?: string | null
}

export type OutreachSequence = {
  subject: string
  step1Body: string
  step2Body: string
  step3Body: string
  cost: number
}

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

/** Type-specific framing: the situation block, email-1 opening beats, and the direct ask. */
function buildFraming(context: OutreachContext): { situation: string; opening: string; ask: string } {
  if (context.opportunityType === "unlinked_mention") {
    return {
      situation: `Page URL: ${context.foundUrl}\nSituation: This page already mentions the product by name but does not link to it. The ask is to turn that existing mention into a link to the product website.`,
      opening: `One sentence thanking them for mentioning the product — reference the page naturally, not templated.`,
      ask: `One short, direct ask — would they mind linking the mention to the product website.`,
    }
  }

  if (context.opportunityType === "resource_page_inclusion") {
    const targetTitle = context.targetTitle || "this resource"
    const targetDescription = context.targetDescription ? `\nTarget page description: ${context.targetDescription}` : ""

    return {
      situation: `Prospect guide/resource page URL: ${context.foundUrl}\nProspect page title: ${context.title || "(unknown)"}\nSelected page to pitch: ${context.targetUrl}\nSelected page title: ${targetTitle}${targetDescription}\nSelected page type: ${context.targetPageType || "resource"}\nWhy it fits: ${context.reason || "The selected page appears useful for this prospect page's readers."}\nSituation: This is a resource page inclusion opportunity. The email must pitch the selected page, not the product homepage. Say that we have or created "${targetTitle}" and that it could be a good addition to their guide/resource page. The ask is to consider adding the selected page as an additional helpful resource for readers.`,
      opening: `One sentence showing you noticed their specific guide/resource page by topic or title, not just the domain.\n- One sentence saying we have or created "${targetTitle}" and why that selected page would be useful for their readers, using the fit reason without sounding like an SEO pitch.`,
      ask: `One short, direct ask — would they consider adding or referencing "${targetTitle}" on their guide/resource page if useful.`,
    }
  }

  const angle = buildAngle(context.pageType, context.competitorDomain)
  return {
    situation: `Anchor text used for competitor: ${context.anchor || "(unknown)"}\nOutreach angle: ${angle}`,
    opening: `One sentence showing you noticed their specific page — make it feel real, not templated.\n- One sentence on why this product belongs alongside ${context.competitorDomain} — specific, no buzzwords.`,
    ask: `One short, direct ask — inclusion, mention, or link.`,
  }
}

export async function generateOutreachSequence(
  product: { product_name: string; product_description: string; website_url: string },
  context: OutreachContext,
  sender: OutreachSender
): Promise<OutreachSequence | null> {
  const cleanContactName = sanitizeContactName(sender.contactName)
  const greeting = cleanContactName ? `Hi ${cleanContactName.split(" ")[0]}` : "Hi there"
  const senderFirstName = sender.senderName?.split(" ")[0] ?? ""

  const voiceTone = sanitizeUserInput(sender.voiceTone)
  const offering = sanitizeUserInput(sender.offering)
  const authorBio = sanitizeUserInput(sender.authorBio)
  const { situation, opening, ask } = buildFraming(context)
  const resourcePageInstructions =
    context.opportunityType === "resource_page_inclusion"
      ? `
Resource page inclusion rules:
- Prioritize the selected page over the product. The product is only background; the selected page is the thing being suggested for inclusion.
- Email 1 must say we have or created the selected page and that it could be a good addition to their guide/resource page.
- Email 2 must bring one new reason the selected page would make their guide/resource page more useful. Keep the selected page as the subject of the note.
- Email 3 must add a final useful angle or make it easy to ignore if they do not update that page anymore. Do not say only "happy to share more details" with no substance.
`
      : ""

  const systemInstructions = `You write a 3-email outreach sequence from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
${situation}
${resourcePageInstructions}${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>\n` : ""}${offering ? `\n<offering>\n${offering}\n</offering>\n` : ""}${authorBio ? `\n<author_bio>\n${authorBio}\n</author_bio>\n` : ""}
Generate all 3 emails. Rules that apply to all:
- Open each email with: ${greeting},
- Separate each paragraph with a blank line.
- No "just following up", "circling back", "touching base", "checking in"
- No em-dashes, no bullet points, no corporate language
- No "SEO", "backlink", "domain authority", "complement", "leverage", "synergy", "workflow"
- Sign off each email with "Best,\\n${senderFirstName}"
- Do not invent offers, benefits, or claims not stated in the offering field above.${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}${sender.isPublicAccount ? "" : "\n- This is sent from the founder's own inbox, so it's fine to say you read replies personally."}

Email 1 — first contact. Tone: casual, direct, like tapping a fellow builder on the shoulder.
- ${opening}${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time — pick the most fitting option, don't list all of them." : ""}
- ${ask}
- 3–4 sentences total.${authorBio ? "\n- Only if <author_bio> contains an actual specific, concrete detail (a hobby, interest, past project, hometown, something like that — not generic bio boilerplate), add one P.S. line after the sign-off referencing it warmly and briefly, like a genuine aside from one human to another. It does not need to relate to the outreach ask. Skip this P.S. entirely if <author_bio> has nothing concrete to reference — never invent a detail." : ""}

Email 2 — follow-up:
- Do not reference when email 1 was sent (no "last week", "a few days ago", "recently", or any time reference).
- Do not open with "just following up" or any variant.
- Do not just restate email 1's ask in different words — bring something new: a different outcome, use case, or social proof, and${offering ? " a different item from <offering> than email 1 used, if <offering> lists more than one" : " a fresh concrete reason this is worth a reply"}.
- 3–4 sentences total.

Email 3 — final outreach:
- Do not reference when previous emails were sent.
- Make clear this is the last outreach, warmly.
- Lead with the most compelling angle not yet covered${offering ? " — if <offering> has an item unused by emails 1 and 2, lead with that one" : ""}. Do not just repeat the ask again with no new substance.
- End with a genuine goodbye, e.g. "No hard feelings if timing isn't right, I won't follow up after this."
- After the sign-off, add a P.S. line reinforcing the goodbye.`

  try {
    return await withLlmRetries(log, async () => {
      log.info("llm request", {
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
        systemInstructions,
        input: "Draft the outreach subject line and all 3 emails.",
      })
      const { text, cost, modelUsed } = await generateTextWithUsage({
        model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
        fallbackModels: [OPENROUTER_MODELS.QWEN_QWEN3_6_FLASH],
        systemInstructions,
        input: "Draft the outreach subject line and all 3 emails.",
        responseFormat: {
          type: "json_schema",
          json_schema: {
            name: "outreach_sequence",
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
        opportunityType: context.opportunityType,
        subject: parsed.email_subject,
        cost_usd: cost.toFixed(4),
        model: modelUsed,
      })
      return {
        subject: parsed.email_subject,
        step1Body: parsed.step1_body,
        step2Body: parsed.step2_body,
        step3Body: parsed.step3_body,
        cost,
      }
    })
  } catch (err) {
    log.warn("email generation failed", { opportunityType: context.opportunityType, error: String(err) })
    return null
  }
}
