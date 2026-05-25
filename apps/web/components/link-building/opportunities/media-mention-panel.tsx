import { IconExternalLink, IconUser } from "@tabler/icons-react"

import type { MediaMention, MediaMentionSource } from "@/app/dashboard/link-building/opportunities/_data"

import { SourceBadge } from "./source-badge"

const SOCIAL_SOURCES = new Set(["twitter", "bluesky"])

const SOCIAL_ACCENT_COLORS: Partial<Record<MediaMentionSource, string>> = {
  twitter: "#000000",
  bluesky: "#0085ff",
}

export function MediaMentionPanel({
  mediaMention,
  isSocialMedia = false,
}: {
  mediaMention: MediaMention | null
  isSocialMedia?: boolean
}) {
  if (!mediaMention) return null

  const requestText = mediaMention.raw_text ?? mediaMention.raw_body
  const isSocial = isSocialMedia || SOCIAL_SOURCES.has(mediaMention.source)

  if (isSocial) {
    const accentColor = SOCIAL_ACCENT_COLORS[mediaMention.source] ?? "#6b7280"
    const authorInitial = (mediaMention.author_name ?? mediaMention.author_handle ?? "?")
      .replace(/^[@]/, "")
      .slice(0, 1)
      .toUpperCase()

    return (
      <section className="relative overflow-hidden rounded-xl border border-border bg-card p-8">
        <div className="absolute left-0 top-0 h-full w-1" style={{ backgroundColor: accentColor }} />

        <div className="mb-5 flex items-start gap-3">
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-white"
            style={{ backgroundColor: accentColor }}
          >
            <span className="text-sm font-bold leading-none">{authorInitial}</span>
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-1.5">
              {mediaMention.author_name && (
                <p className="text-sm font-bold text-foreground">{mediaMention.author_name}</p>
              )}
              {mediaMention.author_handle && (
                <p className="text-xs text-muted-foreground">{mediaMention.author_handle}</p>
              )}
              <SourceBadge source={mediaMention.source} />
            </div>
          </div>
        </div>

        {mediaMention.topic_summary && (
          <h3 className="mb-4 text-lg font-bold leading-snug text-foreground">
            {mediaMention.topic_summary}
          </h3>
        )}

        {requestText && (
          <div className="mb-5 rounded-xl border border-border bg-muted/30 px-4 py-3">
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
              {requestText}
            </p>
          </div>
        )}

        {mediaMention.url && (
          <div className="border-t border-border pt-4">
            <a
              href={mediaMention.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <IconExternalLink className="size-3.5" />
              View post
            </a>
          </div>
        )}
      </section>
    )
  }

  const hasAuthor = mediaMention.author_name ?? mediaMention.author_handle

  return (
    <section className="flex flex-col gap-4 rounded-lg border border-border/60 bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
            Press request
          </p>
          {mediaMention.topic_summary && (
            <p className="text-base font-semibold leading-snug text-foreground">
              {mediaMention.topic_summary}
            </p>
          )}
        </div>
        <SourceBadge source={mediaMention.source} />
      </div>

      {requestText && (
        <div className="max-h-56 overflow-y-auto rounded-md border border-border/50 bg-muted/30 px-4 py-3">
          <p className="whitespace-pre-wrap text-sm leading-6 text-foreground">
            {requestText}
          </p>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        {hasAuthor && (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <IconUser className="size-3.5 shrink-0" />
            {mediaMention.author_name}
            {mediaMention.author_handle && (
              <span className="opacity-70">({mediaMention.author_handle})</span>
            )}
          </span>
        )}
        {mediaMention.url && (
          <a
            href={mediaMention.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <IconExternalLink className="size-3.5" />
            View original request
          </a>
        )}
      </div>
    </section>
  )
}
