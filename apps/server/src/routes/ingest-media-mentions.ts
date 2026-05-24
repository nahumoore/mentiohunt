import { supabaseAdmin } from "@workspace/supabase/admin"
import { Router, type IRouter } from "express"
import { timingSafeEqual } from "node:crypto"
import { createLogger } from "../helpers/logger.js"
import { processMediaMentions } from "../methods/media-mentions/process-media-mentions.js"

const log = createLogger("route-ingest-media-mentions")

export const ingestMediaMentionsRouter: IRouter = Router()

const VALID_SOURCES = ["journofinder", "bluesky", "qwoted", "featured", "email", "unknown"] as const
type MediaMentionSource = (typeof VALID_SOURCES)[number]

interface MediaMentionPayload {
  source: MediaMentionSource
  url?: string | null
  author_name?: string | null
  author_handle?: string | null
  contact_email?: string | null
  publication_domain?: string | null
  topic_summary?: string | null
  deadline?: string | null
  raw_text?: string | null
  raw_body?: string | null
}

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

function isValidSource(value: unknown): value is MediaMentionSource {
  return VALID_SOURCES.includes(value as MediaMentionSource)
}

function validateMention(item: unknown): item is MediaMentionPayload {
  if (!item || typeof item !== "object") return false
  const m = item as Record<string, unknown>
  return isValidSource(m.source)
}

ingestMediaMentionsRouter.post("/hermes/media-mentions", async (req, res) => {
  const expected = process.env.INTERNAL_API_KEY
  if (!expected || !verifyApiKey(req.header("x-internal-api-key"), expected)) {
    res.status(401).json({ error: "unauthorized" })
    return
  }

  const body = req.body
  const mentions: unknown[] = Array.isArray(body)
    ? body
    : Array.isArray(body?.mentions)
      ? body.mentions
      : []

  if (mentions.length === 0) {
    res.status(400).json({ error: "no mentions provided" })
    return
  }

  const valid: MediaMentionPayload[] = []
  const invalid: number[] = []

  for (let i = 0; i < mentions.length; i++) {
    if (validateMention(mentions[i])) {
      valid.push(mentions[i] as MediaMentionPayload)
    } else {
      invalid.push(i)
    }
  }

  if (valid.length === 0) {
    res.status(400).json({ error: "all items failed validation", invalid })
    return
  }

  const processedAt = new Date().toISOString()

  const rows = valid.map((m) => ({
    source: m.source,
    url: m.url ?? null,
    author_name: m.author_name ?? null,
    author_handle: m.author_handle ?? null,
    contact_email: m.contact_email ?? null,
    publication_domain: m.publication_domain ?? null,
    topic_summary: m.topic_summary ?? null,
    deadline: m.deadline ?? new Date().toISOString().split("T")[0],
    raw_text: m.raw_text ?? null,
    raw_body: m.raw_body ?? null,
    processed_at: processedAt,
  }))

  const { data: inserted, error } = await supabaseAdmin
    .from("media_mentions")
    .upsert(rows, { onConflict: "url", ignoreDuplicates: true })
    .select("id, source")

  if (error) {
    log.error("failed to insert media mentions", { error: error.message })
    res
      .status(500)
      .json({ error: "failed to store mentions", message: error.message })
    return
  }

  log.info("media mentions ingested", {
    inserted: valid.length,
    skipped: invalid.length,
  })

  res.json({ inserted: valid.length, skipped: invalid.length, invalid })

  const emailIds = (inserted ?? [])
    .filter((r) => r.source === "email")
    .map((r) => r.id)

  if (emailIds.length > 0) {
    processMediaMentions(emailIds).catch((err) => {
      log.error("process media mentions failed", { error: String(err) })
    })
  }
})
