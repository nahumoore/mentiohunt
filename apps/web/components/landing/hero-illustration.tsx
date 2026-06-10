"use client"

import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import {
  IconCheck,
  IconMailFast,
  IconSend,
  IconWorld,
} from "@tabler/icons-react"
import { AnimatePresence, motion } from "framer-motion"
import { useEffect, useState, type ComponentType, type ReactNode } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const
const INTERVAL = 5000

type Card = {
  id: string
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  source: string
  score: string
  actionLabel: string
  cta: string
  detail: ReactNode
}

const cards: Card[] = [
  {
    id: "community",
    icon: IconBrandRedditNew,
    eyebrow: "Community mention",
    title: '"I need alerts that actually tell me what to act on."',
    source: "r/SaaS · 11 min ago",
    score: "89",
    actionLabel: "Reply drafted",
    cta: "Post reply",
    detail: (
      <div className="flex flex-1 flex-col gap-5">
        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold text-muted-foreground/50 uppercase">
            Thread
          </p>
          <p className="text-sm leading-5 text-muted-foreground italic">
            "Alerts are noisy. I need to know which threads are actually worth
            answering."
          </p>
        </div>
        <div className="h-px bg-border" />
        <div>
          <p className="mb-1.5 text-[0.58rem] font-semibold text-[var(--color-blaze-orange)] uppercase">
            Suggested reply
          </p>
          <p className="text-sm leading-5 text-foreground">
            Worth looking at Mentiohunt — it scores fit and drafts a reply you
            can review before posting.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: "email",
    icon: IconMailFast,
    eyebrow: "Backlink opportunity",
    title: "Resource page ready to pitch",
    source: "growthstack.tools/resources",
    score: "94",
    actionLabel: "Email drafted",
    cta: "Send email",
    detail: (
      <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5">
        {(
          [
            ["Audience", "Early-stage SaaS"],
            ["Page type", "Founder tools list"],
            ["Domain authority", "41"],
            ["Contact", "maria@growthstack.tools"],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-[0.58rem] font-semibold text-muted-foreground/50 uppercase">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "directory",
    icon: IconWorld,
    eyebrow: "Directory listing",
    title: "Site you haven't submitted to yet",
    source: "startupstash.com/tools",
    score: "91",
    actionLabel: "Submission ready",
    cta: "Submit listing",
    detail: (
      <div className="grid flex-1 grid-cols-2 gap-x-8 gap-y-5">
        {(
          [
            ["Category", "Marketing tools"],
            ["Audience", "Founders"],
            ["Monthly visits", "~42 k"],
            ["Status", "Not submitted"],
          ] as [string, string][]
        ).map(([label, value]) => (
          <div key={label}>
            <p className="text-[0.58rem] font-semibold text-muted-foreground/50 uppercase">
              {label}
            </p>
            <p className="mt-1 truncate text-sm font-semibold text-foreground">
              {value}
            </p>
          </div>
        ))}
      </div>
    ),
  },
]

export function HeroIllustration() {
  const [activeIndex, setActiveIndex] = useState(0)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % cards.length)
      setTick(0)
    }, INTERVAL)
    return () => window.clearInterval(id)
  }, [])

  useEffect(() => {
    const id = window.setInterval(() => setTick((t) => t + 1), 50)
    return () => window.clearInterval(id)
  }, [activeIndex])

  const card = cards[activeIndex]!
  const progress = Math.min((tick * 50) / INTERVAL, 1)

  return (
    <div className="relative mx-auto w-full max-w-lg">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/8 blur-3xl dark:bg-[var(--color-princeton-orange)]/12" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease }}
        >
          <OpportunityCard card={card} progress={progress} />
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => {
              setActiveIndex(i)
              setTick(0)
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === activeIndex
                ? "w-6 bg-[var(--color-blaze-orange)]"
                : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>
    </div>
  )
}

function OpportunityCard({
  card,
  progress,
}: {
  card: Card
  progress: number
}) {
  const { icon: Icon, eyebrow, title, source, score, actionLabel, cta, detail } =
    card

  return (
    <div className="flex min-h-[400px] flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
      {/* Progress bar at top */}
      <div className="h-0.5 w-full bg-border">
        <div
          className="h-full bg-[var(--color-blaze-orange)] transition-none"
          style={{ width: `${progress * 100}%` }}
        />
      </div>

      {/* Header */}
      <div className="px-6 pt-5 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">
                {eyebrow}
              </p>
              <p className="text-[0.65rem] text-muted-foreground/55">
                {source}
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-2xl font-black tabular-nums text-[var(--color-blaze-orange)]">
              {score}
            </span>
            <p className="text-[0.5rem] font-bold text-muted-foreground/40 uppercase">
              fit score
            </p>
          </div>
        </div>

        <h3 className="mt-4 font-heading text-base font-semibold leading-snug tracking-tight text-foreground">
          {title}
        </h3>
      </div>

      <div className="mx-6 h-px bg-border" />

      {/* Body */}
      <div className="flex flex-1 flex-col px-6 py-5">
        {detail}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <IconCheck className="h-3.5 w-3.5 text-[var(--color-blaze-orange)]" />
            {actionLabel}
          </span>
          <button className="flex items-center gap-1.5 rounded-full bg-[var(--color-blaze-orange)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
            {cta}
            <IconSend className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
