import { supabaseAdmin } from "@workspace/supabase/admin"
import { sendMentionsAlert } from "../../helpers/emails/email.js"
import { createLogger } from "../../helpers/logger.js"
import { analyzePosts } from "./analyze-posts.js"
import { filterPosts } from "./filter-posts.js"
import { gatherPosts, type ConfigCommunity } from "./gather-posts.js"
import { generateReplies } from "./generate-replies.js"

const log = createLogger("run-reply-queue")

export async function runReplyQueue({
  configId,
  runId,
  sendEmailAlerts = true,
}: {
  configId: string
  runId: string
  sendEmailAlerts?: boolean
}): Promise<{ postsScanned: number; mentionsFound: number }> {
  const { data: config, error: configError } = await supabaseAdmin
    .from("reply_queue_configs")
    .select(
      "id, user_id, product_id, platforms, communities, keywords, email_alerts_enabled, custom_voice_instructions, last_run_at"
    )
    .eq("id", configId)
    .single()

  if (configError || !config) {
    log.error("config not found", { configId })
    await markRunFailed(runId, "Config not found")
    return { postsScanned: 0, mentionsFound: 0 }
  }

  const { data: product, error: productError } = await supabaseAdmin
    .from("products")
    .select("id, product_name, product_description")
    .eq("id", config.product_id)
    .single()

  if (productError || !product) {
    log.error("product not found", { productId: config.product_id })
    await markRunFailed(runId, "Product not found")
    return { postsScanned: 0, mentionsFound: 0 }
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("email")
    .eq("id", config.user_id)
    .single()

  const isFirstRun = !config.last_run_at
  const dateWindowDays = isFirstRun ? 7 : 1
  const dateTo = new Date()
  const dateFrom = new Date(
    dateTo.getTime() - dateWindowDays * 24 * 60 * 60 * 1000
  )

  log.info("starting run", { configId, runId, dateWindowDays, isFirstRun })

  try {
    const communities =
      (config.communities as unknown as ConfigCommunity[]) ?? []

    const gathered = await gatherPosts({
      platforms: config.platforms,
      communities,
      keywords: config.keywords,
      dateWindowDays,
    })

    const { data: existingItems } = await supabaseAdmin
      .from("reply_queue_items")
      .select("platform, post_id, title")
      .eq("config_id", configId)

    const existingKeys = new Set(
      (existingItems ?? []).map((item) => `${item.platform}:${item.post_id}`)
    )
    const existingTitles = new Set(
      (existingItems ?? [])
        .filter((item) => item.title)
        .map((item) => `${item.platform}:${item.title!.toLowerCase().trim()}`)
    )

    const seenTitlesInBatch = new Set<string>()
    const fresh = gathered.filter((p) => {
      if (existingKeys.has(`${p.platform}:${p.post_id}`)) return false
      if (p.title) {
        const titleKey = `${p.platform}:${p.title.toLowerCase().trim()}`
        if (existingTitles.has(titleKey)) return false
        if (seenTitlesInBatch.has(titleKey)) return false
        seenTitlesInBatch.add(titleKey)
      }
      return true
    })

    log.info("dedup", {
      gathered: gathered.length,
      fresh: fresh.length,
      skipped: gathered.length - fresh.length,
    })

    const allowedCommunityKeys = new Set(
      communities.map(
        (c) => `${c.platform}:${c.community.replace(/^r\//i, "").toLowerCase()}`
      )
    )

    const communityFiltered = fresh.filter((p) => {
      if (p.platform !== "reddit") return true
      if (!p.community) return false
      const sub = p.community.replace(/^r\//i, "").toLowerCase()
      return allowedCommunityKeys.has(`${p.platform}:${sub}`)
    })

    log.info("community filter", {
      before: fresh.length,
      after: communityFiltered.length,
      dropped: fresh.length - communityFiltered.length,
    })

    const { posts: filtered, totalCost: filterCost } = await filterPosts(
      communityFiltered,
      product,
      config.keywords
    )
    log.info("filtered", { count: filtered.length })

    const { posts: analyzed, totalCost: analyzeCost } = await analyzePosts(
      filtered,
      product,
      config.keywords
    )
    log.info("analyzed", { count: analyzed.length })

    const { posts: withReplies, totalCost: replyCost } = await generateReplies(
      analyzed,
      product,
      config.custom_voice_instructions
    )
    const totalCost = filterCost + analyzeCost + replyCost
    log.info("replies generated", {
      count: withReplies.length,
      totalCostUsd: totalCost.toFixed(6),
    })

    if (withReplies.length > 0) {
      const rows = withReplies.map((p) => ({
        config_id: configId,
        run_id: runId,
        user_id: config.user_id,
        platform: p.platform,
        post_id: p.post_id,
        title: p.title,
        body: p.body,
        url: p.url,
        community: p.community,
        author: p.author,
        engagement: p.engagement,
        comment_count: p.comment_count,
        post_created_at: p.post_created_at,
        fit_category: p.fit_category,
        fit_score: p.fit_score,
        summary: p.summary,
        suggested_reply: p.suggested_reply,
        user_status: "new" as const,
      }))

      await supabaseAdmin.from("reply_queue_items").insert(rows)
    }

    await supabaseAdmin
      .from("reply_queue_runs")
      .update({
        status: "complete",
        posts_scanned: gathered.length,
        mentions_found: withReplies.length,
        date_from: dateFrom.toISOString(),
        date_to: dateTo.toISOString(),
      })
      .eq("id", runId)

    const { data: currentConfig } = await supabaseAdmin
      .from("reply_queue_configs")
      .select("total_mentions_found")
      .eq("id", configId)
      .single()

    await supabaseAdmin
      .from("reply_queue_configs")
      .update({
        last_run_at: dateTo.toISOString(),
        last_run_status: "complete",
        total_mentions_found:
          (currentConfig?.total_mentions_found ?? 0) + withReplies.length,
      })
      .eq("id", configId)

    if (
      sendEmailAlerts &&
      config.email_alerts_enabled &&
      withReplies.length > 0 &&
      profile?.email
    ) {
      await sendMentionsAlert({
        to: profile.email,
        productName: product.product_name,
        mentionsCount: withReplies.length,
      })
    }

    log.success("run complete", {
      configId,
      runId,
      mentionsFound: withReplies.length,
      totalCostUsd: totalCost.toFixed(6),
    })

    return { postsScanned: gathered.length, mentionsFound: withReplies.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    log.error("run failed", { configId, runId, error: message })
    await markRunFailed(runId, message)
    await supabaseAdmin
      .from("reply_queue_configs")
      .update({
        last_run_at: new Date().toISOString(),
        last_run_status: "failed",
      })
      .eq("id", configId)
    throw err
  }
}

async function markRunFailed(runId: string, error: string) {
  await supabaseAdmin
    .from("reply_queue_runs")
    .update({ status: "failed", error })
    .eq("id", runId)
}
