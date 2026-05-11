import {
  IconArrowUpRight,
  IconBolt,
  IconClockHour4,
  IconRadar,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"

const launchSignals = [
  "Backlink opportunity queues",
  "Community monitoring alerts",
  "Outreach drafts with fit rationale",
]

export function AuthComingSoon() {
  return (
    <main className="relative isolate flex min-h-svh overflow-hidden bg-background text-foreground">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-20 opacity-90"
        style={{
          background:
            "radial-gradient(circle at 16% 12%, color-mix(in oklch, var(--amber-glow) 28%, transparent), transparent 28rem), radial-gradient(circle at 88% 18%, color-mix(in oklch, var(--crimson-carrot) 18%, transparent), transparent 26rem), linear-gradient(135deg, var(--background) 0%, color-mix(in oklch, var(--accent) 34%, var(--background)) 48%, var(--background) 100%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.16] [background-image:linear-gradient(to_right,var(--foreground)_1px,transparent_1px),linear-gradient(to_bottom,var(--foreground)_1px,transparent_1px)] [background-size:72px_72px]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-10 -z-10 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full border border-orange/30 bg-orange/10 blur-3xl"
      />

      <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 py-10 sm:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:px-12 lg:py-16">
        <div className="relative z-10 max-w-3xl">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-card/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm shadow-primary/5 backdrop-blur">
            <span className="relative flex size-2.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-blaze-orange opacity-60" />
              <span className="relative inline-flex size-2.5 rounded-full bg-blaze-orange" />
            </span>
            Private launch queue is warming up
          </div>

          <p className="mb-4 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">
            <IconRadar className="size-4 text-crimson-carrot" aria-hidden />
            Mentiohunt access
          </p>

          <h1 className="max-w-4xl font-heading text-5xl font-semibold leading-[0.94] tracking-[-0.055em] text-foreground sm:text-7xl lg:text-8xl">
            The opportunity engine is almost live.
          </h1>

          <p className="mt-7 max-w-2xl text-lg leading-8 text-muted-foreground sm:text-xl">
            We are tuning the queues that help founders find backlink fits,
            monitor active communities, and prep outreach without turning it
            into another analytics dashboard.
          </p>

          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <a
              href="mailto:hello@mentiohunt.com?subject=Mentiohunt%20early%20access"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background shadow-xl shadow-primary/15 transition duration-200 hover:-translate-y-0.5 hover:bg-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Request early access
              <IconArrowUpRight
                className="size-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-border bg-card/75 px-6 py-3 text-sm font-semibold text-foreground shadow-sm backdrop-blur transition duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Back to homepage
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-xl lg:ml-auto">
          <div className="absolute -left-8 top-10 hidden h-28 w-28 rounded-[2rem] border border-primary/20 bg-card/45 shadow-2xl shadow-primary/10 backdrop-blur md:block" />
          <div className="absolute -right-4 bottom-10 hidden h-20 w-20 rounded-full bg-amber-glow/35 blur-xl md:block" />

          <div className="relative overflow-hidden rounded-[2rem] border border-border bg-card/82 p-4 shadow-2xl shadow-primary/10 backdrop-blur-xl sm:rounded-[2.4rem] sm:p-5">
            <div className="absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-blaze-orange to-transparent" />
            <div className="rounded-[1.5rem] border border-border bg-background/80 p-4 sm:rounded-[1.9rem] sm:p-6">
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Launch desk
                  </p>
                  <p className="mt-1 font-heading text-2xl font-semibold tracking-tight">
                    Access queue
                  </p>
                </div>
                <div className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20">
                  <IconBolt className="size-6" aria-hidden />
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {launchSignals.map((signal, index) => (
                  <div
                    key={signal}
                    className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-4 py-3 transition duration-200 hover:-translate-y-0.5 hover:border-primary/35 hover:shadow-lg hover:shadow-primary/5"
                  >
                    <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-accent text-sm font-bold text-accent-foreground">
                      0{index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-foreground">
                        {signal}
                      </p>
                      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-crimson-carrot via-pumpkin-spice to-amber-glow"
                          style={{ width: `${72 - index * 13}%` }}
                        />
                      </div>
                    </div>
                    <IconSparkles
                      className="size-5 text-primary opacity-60 transition group-hover:rotate-12 group-hover:opacity-100"
                      aria-hidden
                    />
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-3xl bg-foreground p-5 text-background shadow-xl shadow-foreground/10">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-background/65">
                      Current status
                    </p>
                    <p className="mt-2 font-heading text-3xl font-semibold tracking-tight">
                      Calibrating fit signals
                    </p>
                  </div>
                  <IconClockHour4
                    className="size-7 shrink-0 text-amber-glow"
                    aria-hidden
                  />
                </div>
                <p className="mt-5 text-sm leading-6 text-background/70">
                  Access is paused while we finish the first self-serve release.
                  Existing auth routes reopen in dev mode.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
