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

type Card = {
  id: string
  icon: ComponentType<{ className?: string }>
  eyebrow: string
  title: string
  source: string
  score: string
  action: string
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
    action: "Reply drafted",
    detail: (
      <div className="rounded-xl border border-[var(--color-blaze-orange)]/15 bg-[var(--color-blaze-orange)]/6 px-4 py-3">
        <p className="mb-1 text-[0.6rem] font-bold tracking-[0.18em] text-[var(--color-blaze-orange)] uppercase">
          Suggested reply
        </p>
        <p className="text-xs leading-5 text-muted-foreground">
          Worth looking at Mentiohunt — scores thread fit and drafts a reply you
          can review before posting.
        </p>
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
    action: "Email drafted",
    detail: (
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Audience", "Early-stage SaaS"],
          ["Page type", "Founder tools list"],
          ["Domain authority", "41"],
          ["Contact", "maria@growthstack.tools"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
          >
            <p className="text-[0.58rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
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
    action: "Submission ready",
    detail: (
      <div className="grid grid-cols-2 gap-2">
        {[
          ["Category", "Marketing tools"],
          ["Audience", "Founders"],
          ["Monthly visits", "~42 k"],
          ["Status", "Not submitted"],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-xl border border-border bg-background/60 px-3 py-2.5"
          >
            <p className="text-[0.58rem] font-bold tracking-[0.16em] text-muted-foreground uppercase">
              {label}
            </p>
            <p className="mt-0.5 truncate text-xs font-semibold text-foreground">
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

  useEffect(() => {
    const id = window.setInterval(
      () => setActiveIndex((i) => (i + 1) % cards.length),
      5000,
    )
    return () => window.clearInterval(id)
  }, [])

  const card = cards[activeIndex]!

  return (
    <div className="relative mx-auto w-full max-w-xl">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/8 blur-3xl dark:bg-[var(--color-princeton-orange)]/12" />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={card.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.4, ease }}
        >
          <OpportunityCard {...card} />
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 flex justify-center gap-2" aria-hidden="true">
        {cards.map((c, i) => (
          <button
            key={c.id}
            onClick={() => setActiveIndex(i)}
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
  icon: Icon,
  eyebrow,
  title,
  source,
  score,
  action,
  detail,
}: Card) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card text-left shadow-md">
      <div className="border-b border-border bg-background/60 px-6 py-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--color-blaze-orange)]/12 text-[var(--color-blaze-orange)]">
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-[0.62rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
                {eyebrow}
              </p>
              <p className="mt-0.5 text-[0.7rem] text-muted-foreground">
                {source}
              </p>
            </div>
          </div>

          <div className="shrink-0 rounded-xl border border-[var(--color-blaze-orange)]/20 bg-[var(--color-blaze-orange)]/8 px-3 py-1.5 text-center">
            <p className="text-lg font-black leading-none tabular-nums text-[var(--color-blaze-orange)]">
              {score}
            </p>
            <p className="mt-0.5 text-[0.56rem] font-bold tracking-widest text-muted-foreground uppercase">
              fit
            </p>
          </div>
        </div>

        <h3 className="mt-4 font-heading text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
          {title}
        </h3>
      </div>

      <div className="px-6 py-5">
        {detail}

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <IconCheck className="h-3.5 w-3.5 text-[var(--color-blaze-orange)]" />
            {action}
          </span>
          <button className="flex items-center gap-1.5 rounded-full bg-[var(--color-blaze-orange)] px-4 py-2 text-xs font-bold text-white transition-opacity hover:opacity-90">
            Review
            <IconSend className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  )
}
