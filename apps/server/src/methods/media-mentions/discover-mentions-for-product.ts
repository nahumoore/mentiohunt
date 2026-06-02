import { supabaseAdmin } from "@workspace/supabase/admin"
import pLimit from "p-limit"
import { createLogger } from "../../helpers/logger.js"
import { extractDomain, extractEmail } from "../../helpers/extract-from-post.js"
import { buildSearchQueries } from "./build-search-queries.js"
import { classifyMediaRequests } from "./classify-media-requests.js"
import { gatherMediaPosts } from "./gather-media-posts.js"
import { generateOutreachEmail } from "./generate-outreach-email.js"
import { MIN_FIT_SCORE, scoreMentionFit } from "./score-mention-fit.js"
import { validateProspect } from "./validate-prospect.js"

const log = createLogger("discover-mentions-for-product")

const JUNK_DOMAINS = new Set([
  "gmail.com", "yahoo.com", "hotmail.com", "outlook.com", "icloud.com",
  "twitter.com", "x.com", "t.co", "bsky.app", "bluesky.social",
  "facebook.com", "instagram.com", "linkedin.com", "tiktok.com",
])

async function prefilterExistingProspects(
  productId: string,
  foundUrls: string[]
): Promise<Set<string>> {
  if (foundUrls.length === 0) return new Set()

  const { data, error } = await supabaseAdmin
    .from("backlink_prospects")
    .select("found_url")
    .eq("product_id", productId)
    .eq("tier", "media_mention")
    .in("found_url", foundUrls)

  if (error) {
    log.warn("prefilter query failed, skipping", { productId, error: error.message })
    return new Set()
  }

  return new Set(
    (data ?? []).map((r) => r.found_url).filter((u): u is string => u !== null)
  )
}

async function createRun(productId: string, queries: string[]): Promise<string | null> {
  const { data, error } = await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .insert({ product_id: productId, strategy: "media_mention", input: { queries }, status: "running" })
    .select("id")
    .single()
  if (error) {
    log.warn("failed to create run", { productId, error: error.message })
    return null
  }
  return (data as { id: string }).id
}

async function completeRun(runId: string, prospectsCreated: number, costUsd: number): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "completed", completed_at: new Date().toISOString(), prospects_created: prospectsCreated, cost_usd: costUsd })
    .eq("id", runId)
}

async function failRun(runId: string, error: string): Promise<void> {
  await supabaseAdmin
    .from("backlink_prospect_runs" as string)
    .update({ status: "failed", completed_at: new Date().toISOString(), error })
    .eq("id", runId)
}

export async function discoverMentionsForProduct(product: {
  id: string
  product_name: string
  product_description: string
  website_url: string
  competitors: string[]
}): Promise<{ prospectsCreated: number; totalCostUsd: number }> {
  log.info("discovery started", { productId: product.id })

  const queries = await buildSearchQueries(product)
  const runId = await createRun(product.id, queries)

  try {
  const { posts: rawPosts, apifyCostUsd } = await gatherMediaPosts(queries)

  if (rawPosts.length === 0) {
    log.info("no posts gathered", { productId: product.id })
    if (runId) await completeRun(runId, 0, apifyCostUsd)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd }
  }

  const existingUrls = await prefilterExistingProspects(
    product.id,
    rawPosts.map((p) => p.url)
  )
  const freshPosts = rawPosts.filter((p) => !existingUrls.has(p.url))

  log.info("prefilter complete", {
    productId: product.id,
    total: rawPosts.length,
    existing: existingUrls.size,
    fresh: freshPosts.length,
  })

  if (freshPosts.length === 0) {
    if (runId) await completeRun(runId, 0, apifyCostUsd)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd }
  }

  const { kept, totalCost: classifyCost } = await classifyMediaRequests(freshPosts)

  if (kept.length === 0) {
    log.info("no media requests found after classification", { productId: product.id })
    if (runId) await completeRun(runId, 0, apifyCostUsd + classifyCost)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd + classifyCost }
  }

  const mentions = kept.map(({ post, llm }) => ({
    id: post.id,
    topic_summary: llm.topic_summary,
    publication_domain: llm.publication_domain,
    url: post.url,
    raw_text: post.text,
  }))

  const entryByPostId = new Map(kept.map(({ post, llm }) => [post.id, { post, llm }]))

  const { results: scoreResults, totalCost: scoreCost } = await scoreMentionFit(
    product,
    mentions
  )

  for (const r of scoreResults) {
    const entry = entryByPostId.get(r.mentionId)
    log.info("scored mention", {
      postId: r.mentionId,
      fitScore: r.fitScore,
      passed: r.fitScore >= MIN_FIT_SCORE,
      reason: r.reason,
      topic_summary: entry?.llm.topic_summary ?? null,
      url: entry?.post.url ?? null,
    })
  }

  const passing = scoreResults.filter((r) => r.fitScore >= MIN_FIT_SCORE)

  if (passing.length === 0) {
    log.info("no passing mentions after scoring", {
      productId: product.id,
      classified: kept.length,
    })
    if (runId) await completeRun(runId, 0, apifyCostUsd + classifyCost + scoreCost)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd + classifyCost + scoreCost }
  }

  const processLimit = pLimit(5)

  const rows = (
    await Promise.all(
      passing.map(({ mentionId, reason }) =>
        processLimit(async () => {
          const entry = entryByPostId.get(mentionId)
          if (!entry) return null
          const { post, llm } = entry

          const rawText = post.text
          const email = llm.contact_email ?? extractEmail(rawText)
          let domain = llm.publication_domain ?? extractDomain(rawText)
          if (!domain && email) {
            const atIdx = email.lastIndexOf("@")
            if (atIdx > 0) {
              const emailDomain = email.slice(atIdx + 1)
              if (!JUNK_DOMAINS.has(emailDomain)) domain = emailDomain
            }
          }
          if (domain && JUNK_DOMAINS.has(domain)) domain = null

          const actionType = email ? ("email_outreach" as const) : ("social_media" as const)

          log.info("extracted prospect fields", {
            postId: post.id,
            email_source: llm.contact_email ? "llm" : email ? "extracted" : "none",
            domain_source: llm.publication_domain ? "llm" : domain ? "extracted" : "none",
            domain,
            has_email: !!email,
            action_type: actionType,
          })

          const validation = await validateProspect({
            mentionId: post.id,
            rawText,
            domain,
            email,
            actionType,
            authorName: post.author_name ?? null,
          })

          if (!validation || !validation.valid) {
            log.warn("prospect dropped", {
              postId: post.id,
              reason: validation?.reason ?? "validation call failed",
            })
            return null
          }

          const cleanDomain =
            validation.domain && JUNK_DOMAINS.has(validation.domain)
              ? null
              : validation.domain

          log.info("prospect validated", {
            postId: post.id,
            valid: true,
            action_type: validation.actionType,
            domain: cleanDomain,
            has_email: !!validation.email,
          })

          let emailSubject: string | null = null
          let emailBody: string | null = null
          if (validation.actionType === "email_outreach") {
            const result = await generateOutreachEmail(product, {
              id: post.id,
              topic_summary: llm.topic_summary,
              publication_domain: cleanDomain,
              author_name: post.author_name,
              url: post.url,
            })
            if (!result) {
              log.warn("email generation failed, dropping prospect", { postId: post.id })
              return null
            }
            emailSubject = result.email.subject
            emailBody = result.email.body
            log.info("outreach email generated", { postId: post.id, subject: emailSubject })
          }

          const targetUrl = cleanDomain ? `https://${cleanDomain}` : null

          const row = {
            product_id: product.id,
            domain: cleanDomain,
            found_url: post.url,
            target_url: targetUrl,
            tier: "media_mention" as const,
            action_type: validation.actionType,
            contact_email: validation.email,
            contact_name: llm.contact_name ?? null,
            email_subject: emailSubject,
            email_body: emailBody,
            notes: reason,
            raw_post_text: rawText,
          }

          log.info("prospect ready", {
            postId: post.id,
            domain: row.domain,
            action_type: row.action_type,
            contact_email: row.contact_email,
            found_url: row.found_url,
            target_url: row.target_url,
          })

          return row
        })
      )
    )
  ).filter((r): r is NonNullable<typeof r> => r !== null)

  if (rows.length === 0) {
    log.info("no prospects to insert", { productId: product.id })
    if (runId) await completeRun(runId, 0, apifyCostUsd + classifyCost + scoreCost)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd + classifyCost + scoreCost }
  }

  const { count: insertCount, error: insertError } = await supabaseAdmin
    .from("backlink_prospects")
    .insert(rows, { count: "exact" })

  if (insertError) {
    log.error("failed to insert backlink_prospects", {
      productId: product.id,
      error: insertError.message,
    })
    if (runId) await completeRun(runId, 0, apifyCostUsd + classifyCost + scoreCost)
    return { prospectsCreated: 0, totalCostUsd: apifyCostUsd + classifyCost + scoreCost }
  }

  const created = insertCount ?? rows.length
  const totalCostUsd = apifyCostUsd + classifyCost + scoreCost

  log.info("discovery complete", {
    productId: product.id,
    gathered: rawPosts.length,
    fresh: freshPosts.length,
    classified: kept.length,
    passing: passing.length,
    prospectsCreated: created,
    apify_cost_usd: apifyCostUsd.toFixed(4),
    llm_cost_usd: (classifyCost + scoreCost).toFixed(4),
  })

  if (runId) await completeRun(runId, created, totalCostUsd)
  return { prospectsCreated: created, totalCostUsd }

  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    log.error("discovery run failed", { productId: product.id, error: msg })
    if (runId) await failRun(runId, msg)
    return { prospectsCreated: 0, totalCostUsd: 0 }
  }
}
