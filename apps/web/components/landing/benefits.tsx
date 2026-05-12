import {
  IconAlertTriangle,
  IconClockHour4,
  IconMailFast,
  IconRadar2,
  IconSearch,
  IconTargetArrow,
} from "@tabler/icons-react"
import type { ComponentType } from "react"

type Point = {
  title: string
  description: string
  Icon: ComponentType<{ className?: string }>
}

const problems: Point[] = [
  {
    title: "Research starts from zero",
    description:
      "Manual searches, stale lists, and tabs you have to qualify one by one.",
    Icon: IconSearch,
  },
  {
    title: "Fit is hard to explain",
    description:
      "A domain might look useful, but the pitch angle is still unclear.",
    Icon: IconAlertTriangle,
  },
  {
    title: "Threads move too fast",
    description:
      "Relevant Reddit and forum conversations are often found after the moment has passed.",
    Icon: IconClockHour4,
  },
]

const benefits: Point[] = [
  {
    title: "Ranked opportunities",
    description:
      "A daily queue of backlink prospects and active community conversations worth reviewing.",
    Icon: IconTargetArrow,
  },
  {
    title: "Plain-language rationale",
    description:
      "See why the opportunity fits before deciding whether it deserves outreach.",
    Icon: IconRadar2,
  },
  {
    title: "Drafted next steps",
    description:
      "Get the outreach angle, email draft, or suggested reply ready for a founder review.",
    Icon: IconMailFast,
  },
]

const outcomes = [
  "Less manual searching",
  "More qualified opportunities",
  "Faster outreach decisions",
]

function ProblemPoint({ point }: { point: Point }) {
  const Icon = point.Icon

  return (
    <li className="flex gap-4 border-t border-border/70 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {point.description}
        </p>
      </div>
    </li>
  )
}

function BenefitPoint({ point }: { point: Point }) {
  const Icon = point.Icon

  return (
    <li className="flex gap-4 border-t border-[var(--color-blaze-orange)]/20 py-5 first:border-t-0 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--color-blaze-orange)] text-white">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-foreground">{point.title}</h3>
        <p className="mt-1 text-sm leading-6 text-muted-foreground">
          {point.description}
        </p>
      </div>
    </li>
  )
}

export function Benefits() {
  return (
    <section
      id="benefits"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
      aria-labelledby="benefits-title"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-16 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/7 blur-[110px]" />
        <div className="absolute right-0 bottom-20 h-[22rem] w-[22rem] translate-x-1/3 rounded-full bg-[var(--color-amber-flame)]/8 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-[var(--color-blaze-orange)] uppercase">
            Benefits
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2
            id="benefits-title"
            className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]"
          >
            Distribution should not start in a blank spreadsheet.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Mentiohunt turns scattered backlink research and community
            monitoring into a daily queue of scored opportunities, context, and
            outreach-ready next steps.
          </p>
        </div>

        <div className="mt-14 grid overflow-hidden rounded-[2rem] border border-border bg-card shadow-[0_24px_80px_-52px_rgba(0,0,0,0.55)] lg:grid-cols-2">
          <div className="relative p-6 sm:p-8 lg:p-10">
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                    The old way
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
                    Scattered work, unclear payoff
                  </h3>
                </div>
                <div className="hidden rounded-full border border-border bg-background px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase sm:block">
                  Manual
                </div>
              </div>

              <ul className="mt-8">
                {problems.map((point) => (
                  <ProblemPoint key={point.title} point={point} />
                ))}
              </ul>
            </div>
          </div>

          <div className="relative border-t border-border bg-gradient-to-br from-[var(--color-blaze-orange)]/7 via-card to-[var(--color-amber-flame)]/8 p-6 sm:p-8 lg:border-t-0 lg:border-l lg:p-10">
            <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/70 to-transparent lg:inset-y-0 lg:left-0 lg:h-auto lg:w-px lg:bg-gradient-to-b" />
            <div className="relative">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.68rem] font-bold tracking-[0.2em] text-[var(--color-blaze-orange)] uppercase">
                    With Mentiohunt
                  </p>
                  <h3 className="mt-2 font-heading text-2xl font-semibold tracking-tight text-foreground">
                    Discovers opportunities in auto-pilot
                  </h3>
                </div>
                <div className="hidden rounded-full bg-[var(--color-blaze-orange)] px-3 py-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-white uppercase shadow-[0_12px_28px_-16px_rgba(255,84,0,0.95)] sm:block">
                  Ready
                </div>
              </div>

              <ul className="mt-8">
                {benefits.map((point) => (
                  <BenefitPoint key={point.title} point={point} />
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mx-auto mt-6 grid max-w-5xl gap-3 sm:grid-cols-3">
          {outcomes.map((outcome) => (
            <div
              key={outcome}
              className="flex items-center justify-center gap-2 rounded-2xl border border-border bg-card/70 px-4 py-3 text-center text-sm font-semibold text-foreground"
            >
              <span className="h-2 w-2 rounded-full bg-[var(--color-blaze-orange)]" />
              {outcome}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
