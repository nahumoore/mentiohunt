import { createLogger } from "./logger.js"

const log = createLogger("posthog-query")

const POSTHOG_HOST = process.env.POSTHOG_HOST ?? "https://app.posthog.com"

function getConfig() {
  const apiKey = process.env.POSTHOG_API_KEY
  const projectId = process.env.POSTHOG_PROJECT_ID
  if (!apiKey || !projectId) throw new Error("Missing POSTHOG_API_KEY or POSTHOG_PROJECT_ID")
  return { apiKey, projectId }
}

export async function getUserFiredEvents(userId: string): Promise<Set<string>> {
  const { apiKey, projectId } = getConfig()

  const query = `
    SELECT DISTINCT event
    FROM events
    WHERE distinct_id = '${userId.replace(/'/g, "''")}'
      AND timestamp >= now() - INTERVAL 30 DAY
  `

  const res = await fetch(`${POSTHOG_HOST}/api/projects/${projectId}/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: { kind: "HogQLQuery", query } }),
  })

  if (!res.ok) {
    log.warn("posthog query failed", { status: res.status, userId })
    return new Set()
  }

  const json = (await res.json()) as { results?: [string][] }
  const events = new Set<string>()
  for (const row of json.results ?? []) {
    if (row[0]) events.add(row[0])
  }
  return events
}

export type FunnelStage =
  | "stuck_onboarding"
  | "onboarding_done_no_action"
  | "used_mentions_only"
  | "used_opportunities_only"
  | "used_both"

export function classifyFunnelStage(events: Set<string>): FunnelStage {
  const doneOnboarding = events.has("onboarding_completed")
  const usedMentions =
    events.has("mention_opened") ||
    events.has("reply_copied") ||
    events.has("reply_confirmation")
  const usedOpportunities =
    events.has("opportunity_viewed") ||
    events.has("outreach_email_copied") ||
    events.has("outreach_open_in_client") ||
    events.has("directories_page_viewed") ||
    events.has("directory_detail_viewed")

  if (!doneOnboarding) return "stuck_onboarding"
  if (!usedMentions && !usedOpportunities) return "onboarding_done_no_action"
  if (usedMentions && !usedOpportunities) return "used_mentions_only"
  if (!usedMentions && usedOpportunities) return "used_opportunities_only"
  return "used_both"
}
