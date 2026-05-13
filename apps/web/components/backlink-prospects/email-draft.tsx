import { CopyButton } from "./copy-button"

export function EmailDraft({ subject, body }: { subject: string; body: string }) {
  return (
    <div className="overflow-hidden rounded-3xl ring-1 ring-foreground/8">
      <div className="flex items-center justify-between gap-3 border-b border-border/60 bg-muted/40 px-5 py-3">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <span className="shrink-0 text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">
            Subject
          </span>
          <span className="truncate text-sm font-medium">{subject}</span>
        </div>
        <CopyButton text={subject} />
      </div>

      <div className="relative bg-card px-5 py-4">
        <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {body}
        </pre>
        <div className="absolute top-3 right-3">
          <CopyButton text={body} />
        </div>
      </div>
    </div>
  )
}
