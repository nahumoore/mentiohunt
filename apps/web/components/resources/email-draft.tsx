import type { ReactNode } from "react"

interface EmailDraftProps {
  subject: string
  to?: string
  from?: string
  body?: string
  children?: ReactNode
}

export function EmailDraft({
  subject,
  to = "Recipient",
  from = "Sender",
  body,
  children,
}: EmailDraftProps) {
  const bodyText = body?.trim()

  return (
    <figure className="my-10 overflow-hidden rounded-2xl border border-border bg-card shadow-[0_18px_60px_-52px_var(--pumpkin-spice)]">
      <div className="flex h-10 items-center border-b border-border/80 bg-muted/35 px-4">
        <div className="flex items-center gap-2" aria-hidden="true">
          <span className="size-2.5 rounded-full bg-crimson-carrot/80" />
          <span className="size-2.5 rounded-full bg-princeton-orange/70" />
          <span className="size-2.5 rounded-full bg-amber-glow/70" />
        </div>
      </div>

      <div className="divide-y divide-border/80 bg-background">
        <div className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[4.25rem_1fr] sm:gap-3 sm:px-5">
          <span className="text-xs font-medium text-muted-foreground">To</span>
          <span className="text-foreground">{to}</span>
        </div>
        <div className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[4.25rem_1fr] sm:gap-3 sm:px-5">
          <span className="text-xs font-medium text-muted-foreground">From</span>
          <span className="text-foreground">{from}</span>
        </div>
        <div className="grid gap-1 px-4 py-3 text-sm sm:grid-cols-[4.25rem_1fr] sm:gap-3 sm:px-5">
          <span className="text-xs font-medium text-muted-foreground">Subject</span>
          <span className="font-medium text-foreground">{subject}</span>
        </div>
      </div>

      <div className="bg-background px-4 py-5 sm:px-6 sm:py-6">
        {bodyText ? (
          <div className="whitespace-pre-wrap font-sans text-sm leading-7 text-foreground sm:text-[0.95rem]">
            {bodyText}
          </div>
        ) : (
          <div className="font-sans text-sm leading-7 sm:text-[0.95rem] [&_p]:!mt-0 [&_p]:!text-sm [&_p]:!leading-7 [&_p]:!text-foreground [&_p+p]:!mt-4 [&_ul]:!my-2 [&_ul]:!text-sm [&_li]:!leading-7 [&_li]:!text-foreground">
            {children}
          </div>
        )}
      </div>
    </figure>
  )
}
