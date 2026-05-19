import pLimit from "p-limit"
import { generateTextWithUsage } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import { postProcessReply } from "../../helpers/post-process-reply.js"
import type { AnalyzedPost } from "./analyze-posts.js"

const log = createLogger("reply-queue-generate")

export interface PostWithReply extends AnalyzedPost {
  suggested_reply: string
}

function truncateWords(text: string, maxWords: number): string {
  const words = text.split(/\s+/)
  return words.length <= maxWords ? text : words.slice(0, maxWords).join(" ") + "…"
}

export async function generateReplies(
  posts: AnalyzedPost[],
  product: { product_name: string; product_description: string },
  customVoiceInstructions: string | null
): Promise<{ posts: PostWithReply[]; totalCost: number }> {
  if (posts.length === 0) return { posts: [], totalCost: 0 }

  const limit = pLimit(10)
  const results = await Promise.all(
    posts.map((post) => limit(() => generateReply(post, product, customVoiceInstructions)))
  )

  const successful = results.filter((r): r is { post: PostWithReply; cost: number } => r !== null)
  const totalCost = results.reduce((sum, r) => sum + (r?.cost ?? 0), 0)

  log.info("replies result", {
    generated: successful.length,
    failed: results.length - successful.length,
    posts: successful.map(({ post: p }) => ({
      title: p.title ?? truncateWords(p.body, 10),
      platform: p.platform,
      community: p.community,
      fit_score: p.fit_score,
      fit_category: p.fit_category,
      suggested_reply: p.suggested_reply,
    })),
  })

  return { posts: successful.map((r) => r.post), totalCost }
}

async function generateReply(
  post: AnalyzedPost,
  product: { product_name: string; product_description: string },
  customVoiceInstructions: string | null
): Promise<{ post: PostWithReply; cost: number } | null> {
  const blueskyNote =
    post.platform === "bluesky"
      ? "\n\nIMPORTANT: This is a Bluesky post. Reply must be under 300 characters."
      : ""

  const useDefaultVoice = !customVoiceInstructions?.trim()

  const systemInstructions = useDefaultVoice
    ? `You are replying to a social media post on behalf of someone who built ${product.product_name}.

Product: ${product.product_name}
Description: ${product.product_description}

### Writing Rules

- Always use contractions (don't, can't, it's).
- Keep grammar natural but not perfect. Occasional lowercase "i," run-on sentences, or missing commas are fine.
- Do NOT use the 'not only X, but also Y' sentence structure.
- Do NOT use the 'not [x], not [y], just [z]' sentence structure.
- Do NOT use 'moreover' or 'furthermore' to stack points; instead, use direct, declarative sentences.
- Don't end paragraphs with a period.
- Don't use metaphors.
- Never use em-dashes or arrows.
- Never give your thoughts on a tool you don't have enough information about.
- Don't ask for DMs.
- No emoji.

Never use these phrases — they sound like AI:
- "the real X is/was" (real talk, real play, real move, real thing)
- "you're hitting on something" or "you're onto something"
- "here's why:" as a colon-lead explanation
- "honestly"
- "what separates X is Y"
- "certainly", "absolutely", "great question"

### Formatting (non-negotiable)

- Separate every paragraph with a line break.
- Each paragraph must be 1-2 sentences max. Never write a wall of text.
- Don't add bullet points or lists.

### Output

Just return the comment text, no additional text or formatting.${blueskyNote}`
    : `You write helpful, genuine replies to social media posts on behalf of a product.

Product: ${product.product_name}
Description: ${product.product_description}

Voice instructions: ${customVoiceInstructions}

Reply rules:
- Use contractions (I'm, you'll, it's)
- No em-dashes
- No emoji
- Don't ask to DM
- No trailing questions
- Reference specific details from the post
- Don't use AI-sounding phrases like "certainly", "absolutely", "great question"
- Sound like a real person who knows the product well
- Mention the product naturally where relevant${blueskyNote}`

  const model = useDefaultVoice
    ? OPENROUTER_MODELS.ANTHROPIC_CLAUDE_HAIKU_4_5
    : OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH_LITE

  try {
    const { text, cost } = await generateTextWithUsage({
      model,
      systemInstructions,
      input: `Platform: ${post.platform}
Community: ${post.community ?? "N/A"}
Post title: ${post.title ?? "N/A"}
Post body: ${truncateWords(post.body, 300)}
Summary of their need: ${post.summary}
Category: ${post.fit_category}

Write a reply to this post.`,
      responseFormat: {
        type: "json_schema",
        json_schema: {
          name: "reply",
          strict: true,
          schema: {
            type: "object",
            properties: {
              suggested_reply: { type: "string" },
            },
            required: ["suggested_reply"],
            additionalProperties: false,
          },
        },
      },
    })

    const parsed = JSON.parse(text) as { suggested_reply: string }
    const reply = useDefaultVoice
      ? postProcessReply(parsed.suggested_reply)
      : parsed.suggested_reply
    return { post: { ...post, suggested_reply: reply }, cost }
  } catch (err) {
    log.warn("reply generation failed", { postId: post.post_id, error: String(err) })
    return null
  }
}
