import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../../helpers/logger.js"
import { withLlmRetries } from "../../../helpers/llm-retry.js"
import { sanitizeContactName } from "./contact-name.js"
import type { PageType } from "../competitor-backlink/score-backlink-relevance.js"

const log = createLogger("generate-outreach-sequence")

const MAX_USER_INPUT_LENGTH = 400

export type OpportunityType =
  | "competitor_backlink"
  | "unlinked_mention"
  | "listicle_roundup"
  | "resource_page_inclusion"
  | "user_submitted"
  | "broken_link_building"

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
  | {
      // A user-submitted prospect article URL — kept as its own variant
      // (rather than folded into resource_page_inclusion) so buildFraming
      // and buildOutreachContext can discriminate and frame this as "pitch
      // this page into an article the sender read", not a curated list.
      opportunityType: "user_submitted"
      title: string
      foundUrl: string
      targetUrl: string
      targetTitle: string
      targetDescription?: string | null
      targetPageType: string
      reason: string
    }
  | {
      opportunityType: "broken_link_building"
      title: string
      foundUrl: string
      deadUrl: string
      deadUrlStatus: number | "soft_404" | "redirected"
      anchorText: string | null
      targetUrl: string
      targetTitle: string
      matchReason: string
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

/** The LLM is instructed to sign off with "Best,\n{senderFirstName}" but sometimes drops it
 * entirely. Back-fill it deterministically rather than shipping a signature-less email. */
function ensureSignOff(body: string, senderFirstName: string): string {
  const trimmed = body.trimEnd()
  if (!senderFirstName) return trimmed
  const escaped = senderFirstName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const hasSignOff = new RegExp(`best,?\\s*\\n\\s*${escaped}\\b`, "i").test(trimmed)
  if (hasSignOff) return trimmed
  return `${trimmed}\n\nBest,\n${senderFirstName}`
}

/** The system prompt tells the model "no em-dashes" but the model still writes them
 * fairly often (they're a strong LLM-prose habit). Rather than trust the instruction,
 * deterministically strip them the same way `ensureSignOff` backfills sign-offs. */
function stripDashes(body: string): string {
  return body
    .replace(/P\.S\.\s*[—–]\s*/g, "P.S. ") // "P.S. — Love that..." -> "P.S. Love that..."
    .replace(/\s+[—–]\s+/g, ", ") // spaced em/en-dash aside -> comma
    .replace(/(\d)[–—](\d)/g, "$1-$2") // "3–4" -> "3-4"
    .replace(/([a-zA-Z])[—–]([a-zA-Z])/g, "$1, $2") // unspaced "cut—we" -> "cut, we"
    .replace(/[—–]/g, ", ") // any remaining stray dash
    .replace(/,\s*,/g, ",") // collapse ", ," artifacts
    .replace(/,\s*\./g, ".") // collapse ", ." artifacts
}

function sanitizeUserInput(input: string | null | undefined): string | null {
  if (!input) return null
  return stripDashes(input.trim().slice(0, MAX_USER_INPUT_LENGTH))
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
      opening: `One sentence thanking them for mentioning the product, referencing the page naturally, not templated.`,
      ask: `One short, direct ask: would they mind linking the mention to the product website.`,
    }
  }

  if (context.opportunityType === "resource_page_inclusion") {
    const targetTitle = context.targetTitle || "this resource"
    const targetDescription = context.targetDescription ? `\nTarget page description: ${context.targetDescription}` : ""

    return {
      situation: `Prospect guide/resource page URL: ${context.foundUrl}\nProspect page title: ${context.title || "(unknown)"}\nSelected page to pitch: ${context.targetUrl}\nSelected page title: ${targetTitle}${targetDescription}\nSelected page type: ${context.targetPageType || "resource"}\nWhy it fits: ${context.reason || "The selected page appears useful for this prospect page's readers."}\nSituation: This is a resource page inclusion opportunity. The email must pitch the selected page, not the product homepage. Say that we have or created "${targetTitle}" and that it could be a good addition to their guide/resource page. The ask is to consider adding the selected page as an additional helpful resource for readers.`,
      opening: `One sentence showing you noticed their specific guide/resource page by topic or title, not just the domain.\n- One sentence saying we have or created "${targetTitle}" and why that selected page would be useful for their readers, using the fit reason without sounding like an SEO pitch.`,
      ask: `One short, direct ask: would they consider adding or referencing "${targetTitle}" on their guide/resource page if useful.`,
    }
  }

  if (context.opportunityType === "user_submitted") {
    const targetTitle = context.targetTitle || "this page"
    const targetDescription = context.targetDescription ? `\nTarget page description: ${context.targetDescription}` : ""

    return {
      situation: `Prospect article URL: ${context.foundUrl}\nArticle title: ${context.title || "(unknown)"}\nSelected page to pitch: ${context.targetUrl}\nSelected page title: ${targetTitle}${targetDescription}\nSelected page type: ${context.targetPageType || "resource"}\nWhy it fits: ${context.reason || "The selected page appears useful for readers of this article."}\nSituation: The sender read this specific article. The email must pitch the selected page, not the product homepage. Say that we have or created "${targetTitle}" and that it could be useful further reading for this article's readers. The ask is to consider linking to or mentioning it where it fits in the article.`,
      opening: `One sentence showing you actually read their article, referencing its specific angle or argument, not just the domain.\n- One sentence saying we have or created "${targetTitle}" and why it would be useful for the readers of that article, using the fit reason without sounding like an SEO pitch.`,
      ask: `One short, direct ask: would they consider linking to or mentioning "${targetTitle}" in that article if it's useful.`,
    }
  }

  if (context.opportunityType === "broken_link_building") {
    const statusLabel =
      context.deadUrlStatus === "redirected"
        ? "now redirects to an unrelated page"
        : context.deadUrlStatus === "soft_404"
          ? "no longer resolves"
          : `returns a ${context.deadUrlStatus}`
    const anchor = context.anchorText || "(unknown anchor text)"

    return {
      situation: `Prospect page URL: ${context.foundUrl}\nProspect page title: ${context.title || "(unknown)"}\nDead link found on their page: ${context.deadUrl} (${statusLabel})\nAnchor text used for that link: ${anchor}\nSuggested replacement: ${context.targetUrl}\nReplacement title: ${context.targetTitle}\nWhy the replacement fits: ${context.matchReason}\nSituation: Their page links to a URL that is now dead. The email's whole value is a verifiable heads-up about that broken link, true and checkable regardless of what they do about it. The replacement suggestion rides along as a low-pressure second sentence, not the main ask. This is not a resource-page-inclusion pitch and must not read like one — no flattery preamble, no "I was browsing your excellent resource page and noticed" phrasing, no "I noticed" softening. State the dead URL plainly.`,
      opening: `First sentence, stated plainly with no preamble: their page links to ${context.deadUrl} using the anchor text "${anchor}", and that link ${statusLabel} now.\n- Second sentence: mention "${context.targetTitle}" as something that could work as a replacement, framed as optional, not a big ask.`,
      ask: `One short, low-pressure ask: would they consider swapping in the replacement if it's useful. Make clear the dead-link heads-up stands on its own either way.`,
    }
  }

  const angle = buildAngle(context.pageType, context.competitorDomain)
  return {
    situation: `Anchor text used for competitor: ${context.anchor || "(unknown)"}\nOutreach angle: ${angle}`,
    opening: `One sentence showing you noticed their specific page, making it feel real, not templated.\n- One sentence on why this product belongs alongside ${context.competitorDomain}, specific, no buzzwords.`,
    ask: `One short, direct ask: inclusion, mention, or link.`,
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
  // Same instructions govern resource_page_inclusion and user_submitted — both
  // pitch a selected page of ours into an external surface rather than the
  // product itself — with only the noun for that surface differing.
  const surfaceNoun = context.opportunityType === "user_submitted" ? "article" : "guide/resource page"
  const resourcePageInstructions =
    context.opportunityType === "resource_page_inclusion" || context.opportunityType === "user_submitted"
      ? `
Resource page inclusion rules:
- Prioritize the selected page over the product. The product is only background; the selected page is the thing being suggested for inclusion.
- Email 1 must say we have or created the selected page and that it could be a good addition to their ${surfaceNoun}.
- Email 2 must bring one new reason the selected page would make their ${surfaceNoun} more useful. Keep the selected page as the subject of the note.
- Email 3 must add a final useful angle or make it easy to ignore if they do not update that ${surfaceNoun} anymore. Do not say only "happy to share more details" with no substance.
`
      : ""

  const brokenLinkInstructions =
    context.opportunityType === "broken_link_building"
      ? `
Broken link building rules:
- Email 1 must state the exact dead URL and its anchor text in the first sentence. No flattery preamble, no "I was browsing your excellent resource page and noticed" phrasing, no throat-clearing.
- Email 2 must not re-pitch the replacement. Just note that the link is still broken (this is checkable and true) and leave the earlier replacement offer standing without repeating it in full.
- Email 3 must drop the ask entirely. Just leave the information as a courtesy and say a genuine goodbye.
`
      : ""

  const systemInstructions = `You write a 3-email outreach sequence from one founder to another.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Page title: ${context.title || "(unknown)"}
${situation}
${resourcePageInstructions}${brokenLinkInstructions}${voiceTone ? `\n<voice_tone>\n${voiceTone}\n</voice_tone>\n` : ""}${offering ? `\n<offering>\n${offering}\n</offering>\n` : ""}${authorBio ? `\n<author_bio>\n${authorBio}\n</author_bio>\n` : ""}
Generate all 3 emails. Rules that apply to all:
- Open each email with: ${greeting},
- Separate each paragraph with a blank line.
- No "just following up", "circling back", "touching base", "checking in"
- No em-dashes, no bullet points, no corporate language
- No "SEO", "backlink", "domain authority", "complement", "leverage", "synergy", "workflow"
- Sign off each email with "Best,\\n${senderFirstName}"
- Do not invent offers, benefits, or claims not stated in the offering field above.${voiceTone ? "\n- Follow the tone described in <voice_tone>." : ""}${sender.isPublicAccount ? "" : "\n- This is sent from the founder's own inbox, so it's fine to say you read replies personally."}

Email 1, first contact. Tone: casual, direct, like tapping a fellow builder on the shoulder.
- ${opening}${offering ? "\n- One sentence naturally offering something from <offering> to make it worth their time, picking the most fitting option, not listing all of them." : ""}
- ${ask}
- 3 to 4 sentences total.${authorBio ? "\n- Only if <author_bio> contains an actual specific, concrete detail (a hobby, interest, past project, hometown, something like that, not generic bio boilerplate), add one P.S. line after the sign-off referencing it warmly and briefly, like a genuine aside from one human to another. It does not need to relate to the outreach ask. Skip this P.S. entirely if <author_bio> has nothing concrete to reference, never invent a detail." : ""}

Email 2, follow-up:
- Do not reference when email 1 was sent (no "last week", "a few days ago", "recently", or any time reference).
- Do not open with "just following up" or any variant.
- Do not just restate email 1's ask in different words, bring something new: a different outcome, use case, or social proof, and${offering ? " a different item from <offering> than email 1 used, if <offering> lists more than one" : " a fresh concrete reason this is worth a reply"}.
- 3 to 4 sentences total.

Email 3, final outreach:
- Do not reference when previous emails were sent.
- Make clear this is the last outreach, warmly.
- Lead with the most compelling angle not yet covered${offering ? ", and if <offering> has an item unused by emails 1 and 2, lead with that one" : ""}. Do not just repeat the ask again with no new substance.
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
      const dashStripped1 = stripDashes(parsed.step1_body)
      const dashStripped2 = stripDashes(parsed.step2_body)
      const dashStripped3 = stripDashes(parsed.step3_body)
      if (dashStripped1 !== parsed.step1_body || dashStripped2 !== parsed.step2_body || dashStripped3 !== parsed.step3_body) {
        log.info("em-dash present in LLM output, stripped", { opportunityType: context.opportunityType })
      }

      const step1Body = ensureSignOff(dashStripped1, senderFirstName)
      const step2Body = ensureSignOff(dashStripped2, senderFirstName)
      const step3Body = ensureSignOff(dashStripped3, senderFirstName)
      if (step1Body !== dashStripped1 || step2Body !== dashStripped2 || step3Body !== dashStripped3) {
        log.info("sign-off missing from LLM output, backfilled", { opportunityType: context.opportunityType, senderFirstName })
      }

      log.info("email generated", {
        opportunityType: context.opportunityType,
        subject: parsed.email_subject,
        cost_usd: cost.toFixed(4),
        model: modelUsed,
      })
      return {
        subject: parsed.email_subject,
        step1Body,
        step2Body,
        step3Body,
        cost,
      }
    })
  } catch (err) {
    log.warn("email generation failed", { opportunityType: context.opportunityType, error: String(err) })
    return null
  }
}
