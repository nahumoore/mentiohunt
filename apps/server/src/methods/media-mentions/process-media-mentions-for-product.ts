import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import {
  extractDomain,
  extractEmail,
} from "../../helpers/extract-from-post.js"
import { MIN_FIT_SCORE, scoreMentionFit } from "./score-mention-fit.js"
import { generateOutreachEmail } from "./generate-outreach-email.js"
import { validateProspect } from "./validate-prospect.js"

const log = createLogger("method-process-media-mentions-for-product")

const SOCIAL_SOURCES = new Set(["twitter", "bluesky"])

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
    .select("id, source, url, author_name, contact_email, publication_domain, topic_summary, raw_text")
    .or(`deadline.is.null,deadline.gt.${now}`)
    .gte("submitted_at", sevenDaysAgo)

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

  const limit = pLimit(5)

  const rows = (
    await Promise.all(
      passing.map(({ mentionId, reason }) =>
        limit(async () => {
          const mention = mentions.find((m) => m.id === mentionId)
          if (!mention) return null

          const isSocial = SOCIAL_SOURCES.has(mention.source)

          if (isSocial) {
            const rawText = mention.raw_text ?? ""

            const email = mention.contact_email ?? extractEmail(rawText)

            let domain = mention.publication_domain ?? extractDomain(rawText)
            if (!domain && email) {
              const atIdx = email.lastIndexOf("@")
              if (atIdx > 0) domain = email.slice(atIdx + 1)
            }

            const actionType = email ? "email_outreach" as const : "social_media" as const

            const validation = await validateProspect({
              mentionId: mention.id,
              rawText,
              domain,
              email,
              actionType,
              authorName: mention.author_name ?? null,
            })

            if (!validation) {
              log.warn("prospect dropped (validation call failed)", { mentionId: mention.id })
              return null
            }

            if (!validation.valid) {
              log.warn("prospect dropped (validation rejected)", {
                mentionId: mention.id,
                reason: validation.reason,
              })
              return null
            }

            const validatedDomain = validation.domain
            const validatedEmail = validation.email
            const validatedActionType = validation.actionType

            let emailSubject: string | null = null
            let emailBody: string | null = null
            if (validatedActionType === "email_outreach") {
              const result = await generateOutreachEmail(product, mention)
              if (!result) return null
              emailSubject = result.email.subject
              emailBody = result.email.body
            }

            log.info("social prospect resolved", {
              mentionId: mention.id,
              source: mention.source,
              actionType: validatedActionType,
              domain: validatedDomain,
              hasEmail: !!validatedEmail,
            })

            return {
              product_id: product.id,
              domain: validatedDomain,
              target_url: null,
              tier: "media_mention" as const,
              action_type: validatedActionType,
              contact_email: validatedEmail,
              contact_name: mention.author_name ?? null,
              email_subject: emailSubject,
              email_body: emailBody,
              notes: reason,
              source_media_mention_id: mention.id,
            }
          }

          // Non-social path: existing behaviour
          const domain = mention.publication_domain ?? (mention.url ? extractHostname(mention.url) : null)
          if (!domain) {
            log.warn("mention dropped (no url or domain)", {
              mentionId: mention.id,
              url: mention.url,
              publication_domain: mention.publication_domain,
            })
            return null
          }

          const result = await generateOutreachEmail(product, mention)
          if (!result) return null

          return {
            product_id: product.id,
            domain,
            target_url: null,
            tier: "media_mention" as const,
            action_type: "email_outreach" as const,
            contact_email: mention.contact_email ?? null,
            contact_name: mention.author_name ?? null,
            email_subject: result.email.subject,
            email_body: result.email.body,
            notes: reason,
            source_media_mention_id: mention.id,
          }
        })
      )
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) {
    log.info("no prospects to insert", { productId })
    return { prospectsCreated: 0 }
  }

  const { count: insertCount, error: insertError } = await supabaseAdmin
    .from("backlink_prospects")
    .upsert(rows, {
      onConflict: "product_id,source_media_mention_id",
      ignoreDuplicates: true,
      count: "exact",
  })

  if (insertError) {
    log.error("failed to insert backlink_prospects", { error: insertError.message })
    return { prospectsCreated: 0 }
  }

  log.info("backlink prospects created", { count: insertCount ?? rows.length, productId })
  return { prospectsCreated: insertCount ?? rows.length }
}

function extractHostname(url: string): string {
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}
