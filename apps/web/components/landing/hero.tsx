import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

const opportunities = [
  {
    domain: "saasstacks.com",
    label: "Best tools list",
    score: "92",
    detail:
      "Already links to two competitors and refreshes the roundup monthly.",
  },
  {
    domain: "growthopsweekly.com",
    label: "Resource page",
    score: "88",
    detail:
      "Matches your SaaS audience and currently lacks a prospecting workflow tool.",
  },
  {
    domain: "founderfieldnotes.io",
    label: "Alternative page",
    score: "81",
    detail:
      "Mentions adjacent workflow products and invites founder recommendations.",
  },
]

export function Hero() {
  return (
    <section
      id="hero"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28"
    >
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.10),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(15,23,42,0.08),_transparent_28%)]" />
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-14 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-16">
          <div className="max-w-2xl text-center lg:text-left">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-sm text-muted-foreground">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-500" />
              </span>
              Weekly backlink opportunities, not another SEO dashboard
            </div>
            <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-6xl">
              Find the backlink opportunities your team can actually act on this
              week.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg lg:max-w-2xl">
              Mentiohunt turns your site, competitors, and keywords into a
              ranked queue of fit-scored outreach opportunities with clear
              rationale, next steps, and ready-to-send angles.
            </p>
            <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row lg:items-start">
              <Button asChild size="lg">
                <Link href="#queue-preview">Preview the Queue</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="#why-mentions">Why Mentiohunt</Link>
              </Button>
            </div>
            <p className="mt-4 text-sm text-muted-foreground">
              No credit card required | 14-day free trial | Cancel anytime
            </p>

            <div
              id="why-mentions"
              className="mt-10 grid gap-4 text-left sm:grid-cols-3"
            >
              <div className="rounded-2xl border border-border bg-card px-4 py-4">
                <p className="text-2xl font-semibold tracking-tight">14</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Fresh opportunities added to the queue each week
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-4">
                <p className="text-2xl font-semibold tracking-tight">3 min</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  To understand why an opportunity is a fit
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card px-4 py-4">
                <p className="text-2xl font-semibold tracking-tight">1 queue</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  For discovery, rationale, and outreach prep
                </p>
              </div>
            </div>
          </div>

          <div
            id="queue-preview"
            className="relative mx-auto w-full max-w-xl lg:max-w-none"
          >
            <div className="absolute inset-x-10 top-6 -z-10 h-32 rounded-full bg-sky-100 blur-3xl" />
            <div className="rounded-[2rem] border border-border bg-card p-4 sm:p-6">
              <div className="rounded-[1.5rem] border border-border bg-background p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-border pb-4">
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      This Week&apos;s Queue
                    </p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Qualified pages to pitch, submit, or follow up on
                    </p>
                  </div>
                  <div className="rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                    14 live
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  {opportunities.map((opportunity) => (
                    <div
                      key={opportunity.domain}
                      className="rounded-2xl border border-border bg-card p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">
                            {opportunity.domain}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {opportunity.label}
                          </p>
                        </div>
                        <div className="rounded-full border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-medium text-sky-700">
                          Fit {opportunity.score}
                        </div>
                      </div>
                      <p className="mt-3 text-sm leading-6 text-muted-foreground">
                        {opportunity.detail}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-4">
                <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  Why it surfaced
                </p>
                <p className="mt-2 text-sm leading-6 text-foreground">
                  Competitor overlap, matching niche keywords, and a clear
                  outreach angle all raise the opportunity score.
                </p>
              </div>
              <div className="rounded-3xl border border-border bg-primary p-4 text-primary-foreground">
                <p className="text-xs font-medium tracking-[0.14em] text-primary-foreground/70 uppercase">
                  Suggested next step
                </p>
                <p className="mt-2 text-sm leading-6">
                  Pitch the list owner with your product proof, then follow up
                  with the draft already prepared in the queue.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
