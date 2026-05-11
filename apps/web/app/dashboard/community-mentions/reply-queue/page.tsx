import { IconClock, IconMessage2Share, IconSparkles } from "@tabler/icons-react"

export default function ReplyQueuePage() {
  return (
    <div className="relative isolate flex min-h-[560px] items-center justify-center overflow-hidden rounded-[2rem] border border-orange/20 bg-[radial-gradient(circle_at_20%_20%,color-mix(in_oklch,var(--color-amber-glow)_24%,transparent)_0,transparent_34%),linear-gradient(135deg,var(--color-card)_0%,color-mix(in_oklch,var(--color-orange)_8%,var(--color-card))_52%,var(--color-background)_100%)] p-6 text-center shadow-sm ring-1 shadow-orange/5 ring-foreground/5 sm:p-10">
      <div className="pointer-events-none absolute -top-28 right-8 h-72 w-72 rounded-full bg-orange/15 blur-3xl" />
      <div className="pointer-events-none absolute bottom-8 -left-24 h-64 w-64 rounded-full bg-amber-glow/20 blur-3xl" />

      <div className="relative mx-auto flex max-w-2xl flex-col items-center">
        <div className="mb-6 flex size-16 items-center justify-center rounded-3xl bg-foreground text-background shadow-xl ring-1 shadow-orange/10 ring-foreground/10">
          <IconMessage2Share className="size-8 text-amber-flame" />
        </div>

        <div className="inline-flex items-center gap-2 rounded-full border border-orange/25 bg-orange/10 px-3 py-1 text-xs font-semibold tracking-[0.18em] text-primary uppercase">
          <IconClock className="size-3.5" />
          Coming soon
        </div>

        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-foreground sm:text-5xl">
          Reply queue is coming soon.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg">
          We are keeping community mentions hidden while the workflow is being
          prepared. Soon, this page will show matched conversations, fit
          rationale, and ready-to-review reply drafts.
        </p>

        <div className="mt-8 inline-flex items-center gap-2 rounded-full bg-background/70 px-4 py-2 text-sm font-medium text-muted-foreground ring-1 ring-border/70 backdrop-blur">
          <IconSparkles className="size-4 text-primary" />
          No setup or mock queue is available yet.
        </div>
      </div>
    </div>
  )
}
