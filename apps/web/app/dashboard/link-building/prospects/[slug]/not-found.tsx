import Link from "next/link"
import {
  IconAlertCircle,
  IconArrowLeft,
  IconExternalLink,
  IconInfoCircle,
  IconSearch,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

export default function ProspectNotFound() {
  return (
    <main className="relative min-h-[calc(100vh-7rem)] overflow-hidden rounded-4xl border border-border/70 bg-card px-5 py-7 shadow-sm ring-1 ring-foreground/5 sm:px-8 sm:py-10 lg:px-10">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-28 right-[-6rem] size-72 rounded-full bg-orange/20 blur-3xl" />
        <div className="absolute bottom-[-9rem] left-[-8rem] size-80 rounded-full bg-blaze-orange/10 blur-3xl" />
        <div className="absolute inset-0 bg-[linear-gradient(115deg,transparent_0%,transparent_50%,var(--accent)_50%,transparent_51%,transparent_100%)] opacity-40" />
      </div>

      <div className="relative grid min-h-[calc(100vh-12rem)] items-center gap-10 lg:grid-cols-[minmax(0,0.96fr)_minmax(320px,0.7fr)]">
        <section className="max-w-2xl">
          <div className="mb-5 flex flex-wrap items-center gap-3 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase">
            <span>Prospect lookup</span>
            <span className="h-px w-9 bg-orange" />
            <span className="tabular-nums">404</span>
          </div>

          <h1 className="font-heading text-4xl font-semibold tracking-[-0.055em] text-foreground sm:text-5xl lg:text-6xl">
            This opportunity slipped out of the queue.
          </h1>
          <p className="mt-5 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">
            The prospect may have been dismissed, moved, or it may not belong to
            this product. Head back to the queue to keep working from current
            opportunities and suggested next actions.
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="justify-start sm:justify-center">
              <Link href="/dashboard/link-building/prospects">
                <IconArrowLeft className="size-4" />
                Back to prospect queue
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="justify-start sm:justify-center"
            >
              <Link href="/dashboard/link-building/discovery-setup">
                Tune discovery inputs
                <IconExternalLink className="size-4" />
              </Link>
            </Button>
          </div>
        </section>

        <aside className="relative mx-auto w-full max-w-md lg:max-w-none">
          <div className="relative overflow-hidden rounded-[2rem] border border-foreground/10 bg-background/80 p-4 shadow-2xl shadow-orange/10 backdrop-blur">
            <div className="rounded-[1.5rem] border border-border/70 bg-card p-4">
              <div className="flex items-center justify-between gap-3 border-b border-border/70 pb-4">
                <div>
                  <p className="text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                    Queue signal
                  </p>
                  <p className="mt-1 font-heading text-xl font-semibold tracking-tight">
                    No active match
                  </p>
                </div>
                <div className="flex size-11 items-center justify-center rounded-2xl bg-orange/15 text-foreground ring-1 ring-orange/25">
                  <IconSearch className="size-5" />
                </div>
              </div>

              <div className="grid gap-3 py-4">
                <div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-card text-muted-foreground ring-1 ring-foreground/5">
                    <IconInfoCircle className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Prospect record missing</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Check the current queue before preparing outreach.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 rounded-2xl border border-dashed border-orange/30 bg-orange/5 p-3">
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-xl bg-orange/15 text-foreground">
                    <IconAlertCircle className="size-4" />
                  </span>
                  <div>
                    <p className="text-sm font-medium">Do not send from stale data</p>
                    <p className="text-xs leading-5 text-muted-foreground">
                      Contacts and drafts should be reviewed from an active
                      prospect detail page.
                    </p>
                  </div>
                </div>
              </div>

              <div className="relative mt-1 overflow-hidden rounded-2xl bg-foreground p-4 text-background">
                <div className="absolute top-0 right-0 h-full w-1/2 bg-orange/80 [clip-path:polygon(35%_0,100%_0,100%_100%,0_100%)]" />
                <div className="relative flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold tracking-[0.18em] uppercase opacity-70">
                      Status
                    </p>
                    <p className="mt-4 font-heading text-5xl font-semibold tracking-[-0.08em]">
                      404
                    </p>
                  </div>
                  <div className="mb-1 h-14 w-24 rounded-full border border-background/45 border-dashed" />
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  )
}
