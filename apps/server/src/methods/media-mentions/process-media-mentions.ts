import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { MIN_FIT_SCORE, scoreMentionFit } from "./score-mention-fit.js"
import { generateOutreachEmail } from "./generate-outreach-email.js"

const log = createLogger("method-process-media-mentions")

export async function processMediaMentions(mentionIds: string[]): Promise<void> {
  if (mentionIds.length === 0) return

  // Load only email mentions — TODO: handle twitter/bluesky once Apify actor resolves contact emails
  const { data: mentions, error: mentionsError } = await supabaseAdmin
    .from("media_mentions")
    .select(
      "id, source, url, author_name, contact_email, publication_domain, topic_summary"
    )
    .in("id", mentionIds)
    .eq("source", "email")

  if (mentionsError) {
    log.error("failed to load mentions", { error: mentionsError.message })
    return
  }

  if (!mentions || mentions.length === 0) {
    log.info("no email mentions to process")
    return
  }

  // Mentions without a url can't fill required target_url on backlink_prospects
  const processable = mentions.filter((m) => !!m.url)
  const noUrl = mentions.filter((m) => !m.url)

  if (noUrl.length > 0) {
    log.info("mentions skipped (no url)", { count: noUrl.length })
  }

  if (processable.length === 0) return

  const { data: products, error: productsError } = await supabaseAdmin
    .from("products")
    .select("id, user_id, product_name, product_description, website_url, competitors")

  if (productsError) {
    log.error("failed to load products", { error: productsError.message })
    return
  }

  if (!products || products.length === 0) {
    log.info("no products to score against")
    return
  }

  // Collect (product, mention) pairs that pass the fit threshold
  const emailLimit = pLimit(5)
  const productLimit = pLimit(3)

  interface FitPair {
    product: (typeof products)[number]
    mention: (typeof processable)[number]
    reason: string
  }

  const fittingPairs: FitPair[] = []

  await Promise.all(
    products.map((product) =>
      productLimit(async () => {
        const { results } = await scoreMentionFit(product, processable)
        const passing = results.filter((r) => r.fitScore >= MIN_FIT_SCORE)
        for (const scored of passing) {
          const mention = processable.find((m) => m.id === scored.mentionId)
          if (mention) fittingPairs.push({ product, mention, reason: scored.reason })
        }
        log.info("product scored", {
          productId: product.id,
          passing: passing.length,
          total: processable.length,
        })
      })
    )
  )

  if (fittingPairs.length === 0) {
    log.info("no fitting pairs after scoring", { mentions: processable.length, products: products.length })
    return
  }

  // Generate outreach emails for all fitting pairs
  const emailResults = await Promise.all(
    fittingPairs.map(({ product, mention, reason }) =>
      emailLimit(async () => {
        const result = await generateOutreachEmail(product, mention)
        if (!result) return null
        return { product, mention, reason, email: result.email }
      })
    )
  )

  const rows = emailResults
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .map(({ product, mention, reason, email }) => {
      const domain = mention.publication_domain ?? extractHostname(mention.url!)
      return {
        product_id: product.id,
        domain,
        target_url: mention.url!,
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

  if (rows.length > 0) {
    const { error: insertError } = await supabaseAdmin
      .from("backlink_prospects")
      .upsert(rows, {
        onConflict: "product_id,source_media_mention_id",
        ignoreDuplicates: true,
      })

    if (insertError) {
      log.error("failed to insert backlink_prospects", { error: insertError.message })
    } else {
      log.info("backlink prospects created", { count: rows.length })
    }
  }

  log.info("processing complete", {
    mentionsTotal: mentions.length,
    processable: processable.length,
    fittingPairs: fittingPairs.length,
    prospectsInserted: rows.length,
  })
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
