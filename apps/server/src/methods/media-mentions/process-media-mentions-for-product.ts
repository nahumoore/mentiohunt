import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { MIN_FIT_SCORE, scoreMentionFit } from "./score-mention-fit.js"
import { generateOutreachEmail } from "./generate-outreach-email.js"

const log = createLogger("method-process-media-mentions-for-product")

export async function processMediaMentionsForProduct(
  productId: string,
  userId: string
): Promise<{ prospectsCreated: number }> {
  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors")
    .eq("id", productId)
    .eq("user_id", userId)
    .single()

  if (productError || !product) {
    log.error("product not found", { productId, userId, error: productError?.message })
    return { prospectsCreated: 0 }
  }

  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  const now = new Date().toISOString()

  const { data: mentions, error: mentionsError } = await supabaseAdmin
    .from("media_mentions")
    .select("id, source, url, author_name, contact_email, publication_domain, topic_summary")
    .or(`deadline.is.null,deadline.gt.${now}`)
    .gte("processed_at", sevenDaysAgo)

  if (mentionsError) {
    log.error("failed to load mentions", { error: mentionsError.message })
    return { prospectsCreated: 0 }
  }

  if (!mentions || mentions.length === 0) {
    log.info("no eligible mentions", { productId })
    return { prospectsCreated: 0 }
  }

  log.info("mentions loaded", { count: mentions.length, productId })

  const { results } = await scoreMentionFit(product, mentions)
  const passing = results.filter((r) => r.fitScore >= MIN_FIT_SCORE)

  if (passing.length === 0) {
    log.info("no fitting mentions after scoring", { total: mentions.length, productId })
    return { prospectsCreated: 0 }
  }

  log.info("fitting mentions", { count: passing.length, productId })

  const emailLimit = pLimit(5)

  const emailResults = await Promise.all(
    passing.map(({ mentionId, reason }) =>
      emailLimit(async () => {
        const mention = mentions.find((m) => m.id === mentionId)
        if (!mention) return null
        const result = await generateOutreachEmail(product, mention)
        if (!result) return null
        return { mention, reason, email: result.email }
      })
    )
  )

  const rows = emailResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map(({ mention, reason, email }) => {
      const domain = mention.publication_domain ?? (mention.url ? extractHostname(mention.url) : null)
      if (!domain) {
        log.warn("mention dropped (no url or domain)", { mentionId: mention.id, url: mention.url, publication_domain: mention.publication_domain })
        return null
      }
      return {
        product_id: product.id,
        domain,
        target_url: null,
        tier: "media_mention" as const,
        action_type: "email_outreach" as const,
        contact_email: mention.contact_email ?? null,
        contact_name: mention.author_name ?? null,
        email_subject: email.subject,
        email_body: email.body,
        notes: reason,
        source_media_mention_id: mention.id,
      }
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) {
    log.info("no prospects to insert", { productId })
    return { prospectsCreated: 0 }
  }

  const { error: insertError } = await supabaseAdmin
    .from("backlink_prospects")
    .upsert(rows, {
      onConflict: "product_id,source_media_mention_id",
      ignoreDuplicates: true,
    })

  if (insertError) {
    log.error("failed to insert backlink_prospects", { error: insertError.message })
    return { prospectsCreated: 0 }
  }

  log.info("backlink prospects created", { count: rows.length, productId })
  return { prospectsCreated: rows.length }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
