import { IconExternalLink } from "@tabler/icons-react"

export function MediaMentionPanel({ sourceUrl }: { sourceUrl: string | null }) {
  if (!sourceUrl) return null

  return (
    <section className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-4">
      <p className="text-sm text-muted-foreground">Source post</p>
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground transition-colors hover:text-primary"
      >
        <IconExternalLink className="size-3.5 shrink-0" />
        View on platform
      </a>
    </section>
  )
}
