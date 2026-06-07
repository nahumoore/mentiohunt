import { generateText } from "@workspace/openrouter/generate-text"
import { OPENROUTER_MODELS } from "@workspace/openrouter/models"
import { createLogger } from "../../helpers/logger.js"
import type { RedditUserData } from "./fetch-user-data.js"

const log = createLogger("reddit-analyze-user")

export type SubredditActivity = {
  id: string
  name: string
  postsCount: number
  commentsCount: number
  avgScore: number
  category: string
  activityType: "poster" | "commenter" | "both"
}

export type InterestTag = {
  label: string
  confidence: "high" | "medium" | "low"
}

export type BehaviorInsight = {
  title: string
  description: string
}

export type UserAnalysis = {
  profile: RedditUserData["profile"]
  activeSubreddits: SubredditActivity[]
  interests: InterestTag[]
  behaviorInsights: BehaviorInsight[]
  summary: string
  contentType: string
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    summary: { type: "string" },
    contentType: { type: "string" },
    interests: {
      type: "array",
      items: {
        type: "object",
        properties: {
          label: { type: "string" },
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: ["label", "confidence"],
        additionalProperties: false,
      },
    },
    behaviorInsights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          description: { type: "string" },
        },
        required: ["title", "description"],
        additionalProperties: false,
      },
    },
    subreddits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          category: { type: "string" },
          activityType: { type: "string", enum: ["poster", "commenter", "both"] },
        },
        required: ["name", "category", "activityType"],
        additionalProperties: false,
      },
    },
  },
  required: ["summary", "contentType", "interests", "behaviorInsights", "subreddits"],
  additionalProperties: false,
} as const

type AIResponse = {
  summary: string
  contentType: string
  interests: InterestTag[]
  behaviorInsights: BehaviorInsight[]
  subreddits: Array<{ name: string; category: string; activityType: "poster" | "commenter" | "both" }>
}

export async function analyzeRedditUser(data: RedditUserData): Promise<UserAnalysis> {
  const { profile, subreddits } = data

  const subPayload = subreddits.map((s) => ({
    subreddit: `r/${s.subreddit}`,
    posts: s.postsCount,
    comments: s.commentsCount,
    avgScore: s.postsCount + s.commentsCount > 0
      ? Math.round(s.totalScore / (s.postsCount + s.commentsCount))
      : 0,
  }))

  const input = `Reddit user: u/${profile.username}
Total karma: ${profile.totalKarma}
Comment karma: ${profile.commentKarma}
Post karma: ${profile.postKarma}
Account age: ${profile.accountAgeDays} days

Subreddit activity (last 100 posts + 100 comments):
${JSON.stringify(subPayload, null, 2)}`

  const systemInstructions = `You are analyzing a Reddit user's public activity to build a profile of their interests, behavior, and community focus.

Given subreddit activity data, return:

1. summary: 2-3 sentence plain-language profile of who this user appears to be, based on where they're active. Be specific — reference actual communities. Don't be vague.

2. contentType: Short label describing their posting style. Examples: "Predominantly a commenter", "Primarily shares links", "Mix of posts and discussion", "Heavy commenter with occasional posts".

3. interests: Array of inferred interest topics. 5-10 tags max. Confidence:
   - high: clearly evidenced by multiple high-activity subreddits
   - medium: inferred from 1-2 subreddits or indirect signals
   - low: possible based on adjacent activity

4. behaviorInsights: 2-4 behavioral observations. Each needs a short title and a 1-2 sentence description. Look for patterns like: high engagement on niche vs broad communities, commenter vs poster ratio, topic consistency, cross-community behavior.

5. subreddits: For each subreddit in the input, return:
   - name: the subreddit name (e.g. "r/entrepreneur")
   - category: short topic category (e.g. "Founder Community", "Programming", "Gaming", "Finance", etc.)
   - activityType: "poster" if posts >> comments, "commenter" if comments >> posts, "both" if roughly equal

Be direct and specific. Avoid vague claims.`

  const text = await generateText({
    model: OPENROUTER_MODELS.GOOGLE_GEMINI_2_5_FLASH,
    systemInstructions,
    input,
    responseFormat: {
      type: "json_schema",
      json_schema: {
        name: "reddit_user_analysis",
        strict: true,
        schema: RESPONSE_SCHEMA as unknown as Record<string, unknown>,
      },
    },
    timeoutMs: 30_000,
  })

  const parsed = JSON.parse(text) as AIResponse

  log.info("analysis complete", {
    username: profile.username,
    interests: parsed.interests.length,
    insights: parsed.behaviorInsights.length,
    subreddits: parsed.subreddits.length,
  })

  // Merge AI classifications back with raw activity counts
  const rawByName = new Map(subreddits.map((s) => [s.subreddit.toLowerCase(), s]))

  const activeSubreddits: SubredditActivity[] = parsed.subreddits.map((s, i) => {
    const key = s.name.toLowerCase().replace(/^r\//, "")
    const raw = rawByName.get(key)
    const totalActivity = (raw?.postsCount ?? 0) + (raw?.commentsCount ?? 0)
    const avgScore = totalActivity > 0
      ? Math.round((raw?.totalScore ?? 0) / totalActivity)
      : 0

    return {
      id: String(i + 1),
      name: s.name.startsWith("r/") ? s.name : `r/${s.name}`,
      postsCount: raw?.postsCount ?? 0,
      commentsCount: raw?.commentsCount ?? 0,
      avgScore,
      category: s.category,
      activityType: s.activityType,
    }
  })

  return {
    profile,
    activeSubreddits,
    interests: parsed.interests,
    behaviorInsights: parsed.behaviorInsights,
    summary: parsed.summary,
    contentType: parsed.contentType,
  }
}
