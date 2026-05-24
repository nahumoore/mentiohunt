import { IconExternalLink, IconUser } from "@tabler/icons-react"

import type { MediaMention } from "@/app/dashboard/link-building/opportunities/_data"

import { SourceBadge } from "./source-badge"

export function MediaMentionPanel({
  mediaMention,
}: {
  mediaMention: MediaMention | null
}) {
  if (!mediaMention) return null

  const requestText = mediaMention.raw_text ?? mediaMention.raw_body
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
