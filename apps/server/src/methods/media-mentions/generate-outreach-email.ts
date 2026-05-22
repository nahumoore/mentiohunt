import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"

const log = createLogger("media-mentions-generate-email")

interface MentionContext {
  id: string
  topic_summary: string | null
  publication_domain: string | null
  author_name: string | null
  url: string | null
}

export interface OutreachEmail {
  mentionId: string
  subject: string
  body: string
}

export async function generateOutreachEmail(
  product: { product_name: string; product_description: string; website_url: string },
  mention: MentionContext
): Promise<{ email: OutreachEmail; cost: number } | null> {
  const authorGreeting = mention.author_name ? `Hi ${mention.author_name.split(" ")[0]}` : "Hi there"
  const domain = mention.publication_domain ?? mention.url ?? "the publication"
  const topicSummary = mention.topic_summary ?? "a topic related to our space"

  const systemInstructions = `You draft concise, genuine backlink outreach emails for founders.

Product: ${product.product_name}
Description: ${product.product_description}
Website: ${product.website_url}

Publication: ${domain}
Article topic: ${topicSummary}
Author greeting: ${authorGreeting}

Write a short cold outreach email asking the journalist or editor to consider mentioning or linking to this product in a future article. Rules:
- Open with ${authorGreeting},
- Reference the article topic naturally — don't describe it back to them word-for-word.
- One sentence on why this product is relevant to their coverage area.
- One sentence asking if they'd consider a mention or link — keep the ask soft.
- Sign off with "Best," and leave a placeholder "[Your name]" for the sender's name.
- Total length: 4-6 sentences. No fluff, no promises, no guarantees of backlinks.
- Do not use em-dashes or bullet points.
- Do not mention "SEO" or "domain authority".`

  try {
    const { text, cost } = await generateTextWithUsage({
      model: OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5,
      systemInstructions,
      input: `Draft the outreach email and subject line.`,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "outreach_email",
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

    return {
      email: {
        mentionId: mention.id,
        subject: parsed.email_subject,
        body: parsed.email_body,
      },
      cost,
    }
  } catch (err) {
    log.warn("email generation failed", { mentionId: mention.id, error: String(err) })
    return null
  }
}
