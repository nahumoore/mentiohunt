import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { supabaseAdmin } from "@workspace/supabase/admin"
import type { Json } from "@workspace/supabase/database-types"
import { createLogger, withRouteLog } from "../helpers/logger.js"
import { scraperLightLimit } from "../helpers/scraper-limits.js"
import { resolveEmailAccount } from "../processes/onboarding/resolve-email-account.js"
import { resolveSenderName } from "../methods/prospect-generation-methods/shared/resolve-sender-name.js"
import { createSequencesForProspect } from "../processes/onboarding/prospect-sequences.js"
import { enrichDomainRatings } from "../methods/prospect-generation-methods/shared/enrich-domain-ratings.js"
import { scoreSiteRelevance } from "../methods/prospect-generation-methods/shared/score-site-relevance.js"
import { pickTargetPageForUrl } from "../methods/prospect-generation-methods/user-submitted/pick-target-page.js"
import { enrichUserSubmitted } from "../methods/prospect-generation-methods/user-submitted/enrichment.js"
import type { TargetPageCandidate, TargetPageChoice } from "../methods/prospect-generation-methods/user-submitted/types.js"

const log = createLogger("route-prospect-submitted-url")

export const prospectSubmittedUrlRouter: IRouter = Router()

function verifyApiKey(provided: string | undefined, expected: string): boolean {
  if (!provided) return false
  try {
    const a = Buffer.from(provided)
    const b = Buffer.from(expected)
    if (a.length !== b.length) return false
    return timingSafeEqual(a, b)
  } catch {
    return false
  }
}

function toJson(value: Record<string, unknown>): Json {
  return value as Json
}

type FetchedArticle = { title: string; description: string; text: string }

async function fetchArticleContent(url: string): Promise<FetchedArticle | null> {
  const scraperUrl = process.env.SCRAPER_URL
  if (!scraperUrl) {
    log.warn("SCRAPER_URL not set, skipping fetch-content")
    return null
  }

  return scraperLightLimit(async () => {
    try {
      const scraperApiKey = process.env.SCRAPER_API_KEY
      const res = await fetch(`${scraperUrl}/fetch-content`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(scraperApiKey ? { "x-api-key": scraperApiKey } : {}),
        },
        body: JSON.stringify({ url }),
        signal: AbortSignal.timeout(60_000),
      })
      if (!res.ok) {
        log.warn("scraper fetch-content failed", { url, status: res.status })
        return null
      }
      return (await res.json()) as FetchedArticle
    } catch (err) {
      log.warn("scraper fetch-content error", { url, error: String(err) })
      return null
    }
  })
}

/** Best-effort title when the article couldn't be fetched — a slug beats a blank field. */
function titleFromUrl(url: string): string {
  try {
    const parsed = new URL(url)
    const slug = parsed.pathname.split("/").filter(Boolean).pop() ?? parsed.hostname
    return slug.replace(/[-_]+/g, " ").replace(/\.\w+$/, "").replace(/\b\w/g, (c) => c.toUpperCase()) || parsed.hostname
  } catch {
    return url
  }
}

/**
 * Loads the candidate target page: the exact page the user picked in the
 * submit form if they picked one, otherwise every crawled page of theirs
 * (for pickTargetPageForUrl to choose among), falling back to a synthetic
 * "product website" candidate if nothing is crawled yet.
 */
async function resolveTargetChoice(
  productId: string,
  explicitPageId: string | null,
  article: { title: string; text: string },
  product: { product_name: string; product_description: string; website_url: string }
): Promise<TargetPageChoice> {
  if (explicitPageId) {
    const { data: page } = await supabaseAdmin
      .from("product_pages")
      .select("id, url, title, description, page_type, priority, keywords")
      .eq("id", explicitPageId)
      .eq("product_id", productId)
      .maybeSingle()

    if (page) {
      return {
        page: { ...page, keywords: page.keywords ?? [] },
        score: 5,
        reason: "You picked this page for this article.",
        cost: 0,
      }
    }
    log.warn("explicit product_page_id not found, falling back to auto-pick", { productId, explicitPageId })
  }

  const { data: pages } = await supabaseAdmin
    .from("product_pages")
    .select("id, url, title, description, page_type, priority, keywords")
    .eq("product_id", productId)
    .eq("crawl_status", "crawled")
    .order("priority", { ascending: true })
    .limit(25)

  const candidates: TargetPageCandidate[] = (pages ?? []).map((p) => ({ ...p, keywords: p.keywords ?? [] }))

  const choice = await pickTargetPageForUrl(article, candidates, product)
  if (choice) return choice

  // No crawled pages at all yet — fall back to the product website itself so
  // the pipeline still produces a coherent pitch instead of failing outright.
  return {
    page: {
      id: "product-website",
      url: product.website_url,
      title: product.product_name,
      description: product.product_description,
      page_type: "landing_page",
      priority: 5,
      keywords: [],
    },
    score: 2,
    reason: "No tracked pages were crawled yet, so your product website was pitched instead.",
    cost: 0,
  }
}

async function runSubmittedUrlPipeline(userId: string, productId: string, prospectId: string): Promise<void> {
  const { data: prospect, error: prospectError } = await supabaseAdmin
    .from("backlink_prospects")
    .select("id, product_id, product_page_id, found_url, domain, raw_metadata")
    .eq("id", prospectId)
    .eq("product_id", productId)
    .maybeSingle()

  if (prospectError || !prospect || !prospect.found_url || !prospect.domain) {
    log.error("prospect not found", { prospectId, error: prospectError?.message })
    return
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description, website_url")
    .eq("id", productId)
    .single()

  if (productError || !product) {
    log.error("product not found", { productId, error: productError?.message })
    return
  }

  const { data: settings } = await supabaseAdmin
    .from("backlink_prospects_settings")
    .select("voice_tone, offering")
    .eq("product_id", productId)
    .maybeSingle()

  await supabaseAdmin.from("backlink_prospects").update({ enrichment_status: "enriching" }).eq("id", prospectId)

  const existingMetadata =
    prospect.raw_metadata !== null && typeof prospect.raw_metadata === "object" && !Array.isArray(prospect.raw_metadata)
      ? (prospect.raw_metadata as Record<string, unknown>)
      : {}
  const submissionMeta = (existingMetadata.user_submitted as Record<string, unknown> | undefined) ?? {}

  const scraped = await fetchArticleContent(prospect.found_url)
  const article = {
    title: scraped?.title || titleFromUrl(prospect.found_url),
    text: scraped?.text || scraped?.description || "",
  }
  const scrapeFailed = !scraped

  const targetChoice = await resolveTargetChoice(productId, prospect.product_page_id, article, product)

  const [ratingsMap, relevance] = await Promise.all([
    enrichDomainRatings([prospect.domain]),
    scoreSiteRelevance(
      [{ id: prospect.found_url, domain: prospect.domain, title: article.title, snippet: article.text.slice(0, 500) }],
      product
    ),
  ])
  const domainRating = ratingsMap.get(prospect.domain) ?? null
  const relevanceScore = relevance.results.get(prospect.found_url)?.score ?? null

  const sender = await resolveSenderName(userId)
  const enriched = await enrichUserSubmitted(
    { prospectId, url: prospect.found_url, domain: prospect.domain, article },
    targetChoice,
    product,
    sender,
    { voice_tone: settings?.voice_tone ?? null, offering: settings?.offering ?? null }
  )

  const mergedMetadata = {
    ...(enriched.raw_metadata as Record<string, unknown> | null),
    user_submitted: {
      ...submissionMeta,
      target_page_mode: prospect.product_page_id ? "manual" : "auto",
      targetPageId: targetChoice.page.id,
      targetPageType: targetChoice.page.page_type,
      targetTitle: targetChoice.page.title,
      fitScore: targetChoice.score,
      fitReason: targetChoice.reason,
      cost_usd: targetChoice.cost + relevance.cost,
      ...(scrapeFailed ? { scrape_failed: true } : {}),
    },
  }

  const hasEmail = !!enriched.contact_email
  const hasDraft = !!enriched.email_subject && !!enriched.email_body

  if (!hasEmail || !hasDraft) {
    // No email found (or draft generation failed even with a valid email) —
    // hand off to the existing manual-completion flow on the detail page,
    // same terminal state buildOutreachContext already knows how to resume.
    await supabaseAdmin
      .from("backlink_prospects")
      .update({
        contact_name: enriched.contact_name,
        contact_social_links: enriched.contact_social_links,
        product_page_id: targetChoice.page.id === "product-website" ? null : targetChoice.page.id,
        target_url: targetChoice.page.url,
        domain_rating: domainRating,
        site_relevance_score: relevanceScore,
        raw_metadata: toJson(mergedMetadata),
        enrichment_status: "failed",
        status: "email_not_found",
      })
      .eq("id", prospectId)

    log.info("no contact/draft found for submitted url, awaiting manual completion", { prospectId })
    return
  }

  const { error: updateError } = await supabaseAdmin
    .from("backlink_prospects")
    .update({
      contact_name: enriched.contact_name,
      contact_email: enriched.contact_email,
      contact_social_links: enriched.contact_social_links,
      email_subject: enriched.email_subject,
      email_body: enriched.email_body,
      product_page_id: targetChoice.page.id === "product-website" ? null : targetChoice.page.id,
      target_url: targetChoice.page.url,
      domain_rating: domainRating,
      site_relevance_score: relevanceScore,
      raw_metadata: toJson(mergedMetadata),
      enrichment_status: "ready",
      status: "new",
    })
    .eq("id", prospectId)

  if (updateError) {
    log.error("failed to update prospect after enrichment", { prospectId, error: updateError.message })
    return
  }

  const account = await resolveEmailAccount(userId)
  if (!account) {
    // Leave the row ready with no email_account_id — the existing
    // assignSequences safety-net sweep picks up ready/unassigned prospects.
    log.warn("no email account available, leaving prospect ready and unassigned", { prospectId })
    return
  }

  await createSequencesForProspect(
    {
      id: prospectId,
      contactName: enriched.contact_name,
      emailSubject: enriched.email_subject,
      emailBody: enriched.email_body,
      step2Body: enriched.step2_body,
      step3Body: enriched.step3_body,
    },
    account
  )

  log.success("submitted url enriched and scheduled", { prospectId })
}

prospectSubmittedUrlRouter.post("/prospects/submit-url", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body as Record<string, unknown>
  const userId = typeof body?.userId === "string" ? body.userId.trim() : ""
  const productId = typeof body?.productId === "string" ? body.productId.trim() : ""
  const prospectId = typeof body?.prospectId === "string" ? body.prospectId.trim() : ""

  if (!userId || !productId || !prospectId) {
    res.status(400).json({ error: "userId, productId and prospectId are required" })
    return
  }

  res.status(202).json({ queued: true })

  withRouteLog(`submit-url-${prospectId}`, () => runSubmittedUrlPipeline(userId, productId, prospectId)).catch((err) =>
    log.error("unhandled submit-url pipeline error", { prospectId, error: String(err) })
  )
})

export { runSubmittedUrlPipeline }
