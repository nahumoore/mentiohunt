"use client"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import {
  IconCheck,
  IconMailFast,
  IconRadar2,
  IconSend,
  IconWorld,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const
const steps = ["community", "email", "directory"] as const

type DemoStep = (typeof steps)[number]

export function HeroIllustration() {
  const [activeIndex, setActiveIndex] = useState(0)
  const activeStep = steps[activeIndex]!

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % steps.length)
    }, 5000)

    return () => window.clearInterval(interval)
  }, [])

  return (
    <div className="relative mx-auto w-full max-w-6xl">
      <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/8 blur-3xl dark:bg-[var(--color-princeton-orange)]/12" />

      <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card/95 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.3)] backdrop-blur-xl dark:bg-card">
        <div className="flex items-center justify-between border-b border-border/70 bg-background/70 px-4 py-3 sm:px-5">
          <div className="flex items-center gap-3 text-left">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)] text-white">
              <IconRadar2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
                Live demo
              </p>
              <p className="text-sm font-semibold text-foreground">
                One opportunity, one next action
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5" aria-hidden="true">
            {steps.map((step) => (
              <span
                key={step}
                className={`h-2 w-2 rounded-full transition-colors ${
                  activeStep === step
                    ? "bg-[var(--color-blaze-orange)]"
                    : "bg-muted-foreground/25"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative overflow-hidden bg-background/40 p-3 sm:p-5 lg:p-6">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.42, ease }}
            >
              {renderStep(activeStep)}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

function renderStep(step: DemoStep) {
  if (step === "community") {
    return (
      <DemoCard
        icon={IconBrandRedditNew}
        eyebrow="Community mention"
        title="A Reddit thread matches your product"
        source="r/SaaS · posted 11 min ago"
        score="89"
        action="Suggested reply ready"
      >
        <p>
          “Alerts are noisy. I need to know which threads are actually worth
          answering.”
        </p>
        <DraftBox>
          Worth looking at Mentiohunt if you want fewer noisy alerts. It scores
          fit and drafts a reply you can review before posting.
        </DraftBox>
      </DemoCard>
    )
  }

  if (step === "email") {
    return (
      <DemoCard
        icon={IconMailFast}
        eyebrow="Backlink outreach"
        title="A high-fit resource page is ready to pitch"
        source="growthstack.tools/resources"
        score="94"
        action="Email draft ready"
      >
        <SignalRows
          rows={[
            ["Audience", "Early-stage SaaS"],
            ["Page type", "Founder tools list"],
            ["Contact", "maria@growthstack.tools"],
          ]}
        />
        <DraftBox>
          Hi Maria, Mentiohunt could be a useful addition to your founder tools
          page for teams looking for backlink and community mention opportunities.
        </DraftBox>
      </DemoCard>
    )
  }

  return (
    <DemoCard
      icon={IconWorld}
      eyebrow="Directory submission"
      title="We found a directory you have not submitted to yet"
      source="startupstash.com/tools"
      score="91"
      action="Submission prep ready"
    >
      <SignalRows
        rows={[
          ["Category", "Marketing tools"],
          ["Why it fits", "Founder audience"],
          ["Status", "Not submitted yet"],
        ]}
      />
      <DraftBox>
        Mentiohunt can prepare the title, short description, URL, and category
        so you can review the listing before submission.
      </DraftBox>
    </DemoCard>
  )
}

function DemoCard({
  icon: Icon,
  eyebrow,
  title,
  source,
  score,
  action,
  children,
}: {
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  source: string
  score: string
  action: string
  children: ReactNode
}) {
  return (
    <section className="mx-auto max-w-4xl rounded-[1.35rem] border border-border bg-card p-4 text-left shadow-sm sm:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {eyebrow}
            </p>
            <h3 className="mt-1 font-heading text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
              {title}
            </h3>
            <p className="mt-1 truncate text-xs font-semibold text-muted-foreground">
              {source}
            </p>
          </div>
        </div>

        <div className="shrink-0 rounded-2xl border border-[var(--color-blaze-orange)]/18 bg-[var(--color-blaze-orange)]/7 px-3 py-2 text-center">
          <div className="text-xl font-black tracking-tight text-[var(--color-blaze-orange)] tabular-nums">
            {score}
          </div>
          <div className="text-[0.56rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            Fit
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-4 text-sm leading-6 text-muted-foreground">
        {children}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <span className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
          <IconCheck className="h-3.5 w-3.5 text-[var(--color-blaze-orange)]" />
          {action}
        </span>
        <span className="flex items-center gap-2 rounded-full bg-[var(--color-blaze-orange)] px-4 py-2 text-xs font-bold text-white">
          Review
          <IconSend className="h-3.5 w-3.5" />
        </span>
      </div>
    </section>
  )
}

function SignalRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y divide-border rounded-3xl border border-border bg-background/70">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 px-4 py-3">
          <span className="text-[0.62rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
            {label}
          </span>
          <span className="text-right text-sm font-semibold text-foreground">
            {value}
          </span>
        </div>
      ))}
    </div>
  )
}

function DraftBox({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-background/70 p-4 text-sm leading-6 text-muted-foreground">
      {children}
    </div>
  )
}
