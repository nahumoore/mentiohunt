import type { Json } from "@workspace/supabase/database-types"

import type { ConversationMetadata, VisitorContextInput } from "./types"

const MAX_PAGE_TRAIL = 10

/**
 * Merges a visitor context snapshot into existing conversation metadata.
 * Entry URL / referrer / UTM are first-touch attribution — set once and
 * never overwritten by a later page view. Locale/timezone/viewport/user
 * agent always reflect the most recent snapshot. `pages` is a rolling trail
 * of the last 10 distinct page visits.
 */
export function mergeConversationMetadata(
  existing: unknown,
  input: Partial<VisitorContextInput>,
  userAgent?: string | null
): ConversationMetadata {
  const current = (
    existing && typeof existing === "object" ? existing : {}
  ) as ConversationMetadata

  const next: ConversationMetadata = { ...current }

  if (!next.entry_url && input.entryUrl) next.entry_url = input.entryUrl
  if (!next.referrer && input.referrer) next.referrer = input.referrer
  if (!next.utm && input.utm && Object.values(input.utm).some(Boolean)) {
    next.utm = input.utm
  }

  if (input.locale) next.locale = input.locale
  if (input.timezone) next.timezone = input.timezone
  if (input.viewport) next.viewport = input.viewport
  if (userAgent) next.user_agent = userAgent

  if (input.path) {
    const pages = [...(next.pages ?? [])]
    const last = pages[pages.length - 1]
    if (!last || last.path !== input.path) {
      pages.push({
        path: input.path,
        title: input.title,
        at: new Date().toISOString(),
      })
    }
    next.pages = pages.slice(-MAX_PAGE_TRAIL)
  }

  return next
}

/** Casts conversation metadata for a Supabase insert/update payload. */
export function toJsonMetadata(metadata: ConversationMetadata): Json {
  return metadata as unknown as Json
}
