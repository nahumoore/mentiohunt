"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
}

const proofItems = [
  "Qualified opportunities, not noisy domain lists",
  "Plain-language fit rationale and next steps",
  "Built for founders and small agencies",
]

const opportunity = {
  title: "Top link building tools for bootstrapped startups",
  type: "Listicle",
  score: 91,
  domain: "growthhackers.com",
  da: 58,
  traffic: "~34k/mo",
  scanned: "2h ago",
  draft: {
    to: "nick@growthhackers.com",
    subject: "Addition for your link building tools roundup",
    body: "Hi Nick,\n\n I just read your article on link building tools for bootstrapped startups and thought we'd be a great fit.\n\nYou cover several enterprise tools but there's nothing self-serve for founders. Mentiohunt does exactly that — surfaces directories, listicles, and alternative pages worth pitching every week.",
  },
}

export function HeroContent() {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="grid items-center gap-12 lg:grid-cols-[1fr_1.12fr] lg:gap-16">
        {/* Left: Copy */}
        <div>
          <motion.div
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, ease }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-blaze-orange)]/30 bg-[var(--color-blaze-orange)]/8 px-3.5 py-1.5 text-[0.68rem] font-semibold tracking-[0.18em] text-[var(--color-princeton-orange)] uppercase">
              <span className="relative flex h-1.5 w-1.5 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-blaze-orange)] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-blaze-orange)]" />
              </span>
              Backlink opportunity queue
            </div>
          </motion.div>

          <motion.h1
            className="mt-5 font-heading text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[3.6rem] xl:text-[4.2rem]"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.07, ease }}
          >
            Discover which sites to pitch for backlinks{" "}
            <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
              every week.
            </span>
          </motion.h1>

          <motion.p
            className="mt-5 max-w-lg text-base leading-7 text-muted-foreground sm:text-lg sm:leading-8"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.14, ease }}
          >
            Mentiohunt turns your site, keywords, and competitors into a
            recurring queue of qualified opportunities — with fit, next steps,
            outreach angles, and contact info when available.
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center gap-3"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.21, ease }}
          >
            <Button
              asChild
              size="lg"
              className="rounded-full px-7 shadow-md shadow-primary/25"
            >
              <Link href="/signup">
                Start for free
                <IconArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Link
              href="#how-it-works"
              className="flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See how it works
              <IconArrowRight className="h-3.5 w-3.5" />
            </Link>
          </motion.div>

          <motion.ul
            className="mt-7 space-y-2.5"
            variants={fadeUp}
            initial="initial"
            animate="animate"
            transition={{ duration: 0.55, delay: 0.28, ease }}
          >
            {proofItems.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2.5 text-sm text-muted-foreground"
              >
                <span className="mt-[0.35rem] h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--color-princeton-orange)]" />
                {item}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Right: Product mockup */}
        <motion.div
          className="relative"
          variants={fadeUp}
          initial="initial"
          animate="animate"
          transition={{ duration: 0.7, delay: 0.16, ease }}
        >
          <div className="pointer-events-none absolute -inset-6 -z-10 rounded-[3rem] bg-[var(--color-princeton-orange)]/7 blur-3xl dark:bg-[var(--color-princeton-orange)]/10" />

          <div className="relative overflow-hidden rounded-[2rem] border border-[var(--color-border)] bg-card/95 shadow-[0_20px_70px_-28px_rgba(0,0,0,0.26)] backdrop-blur-xl dark:bg-card">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-amber-glow)]/70 to-transparent" />

            {/* Window chrome */}
            <div className="flex items-center gap-1.5 border-b border-[var(--color-border)] px-5 py-3.5">
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
              <span className="h-2.5 w-2.5 rounded-full bg-[var(--color-border)]" />
              <span className="ml-4 text-[0.6rem] font-medium tracking-widest text-muted-foreground/50 uppercase">
                Mentiohunt · Opportunity Queue
              </span>
            </div>

            <div className="p-4 sm:p-5">
              {/* Queue header */}
              <div className="mb-3.5 flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">
                  18 qualified this week
                </p>
                <div className="flex items-center gap-1.5 rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/8 px-3 py-1 text-[0.68rem] font-semibold text-[var(--color-princeton-orange)]">
                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--color-blaze-orange)] opacity-60" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--color-blaze-orange)]" />
                  </span>
                  Live
                </div>
              </div>

              {/* Single opportunity card */}
              <div className="rounded-[1.4rem] border border-[var(--color-blaze-orange)]/22 bg-[var(--color-blaze-orange)]/5">
                {/* Opportunity header */}
                <div className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-[var(--color-blaze-orange)]/25 bg-[var(--color-blaze-orange)]/10 px-2 py-0.5 text-[0.58rem] font-semibold tracking-[0.1em] text-[var(--color-blaze-orange)] uppercase">
                        {opportunity.type}
                      </span>
                      <span className="text-[0.65rem] text-muted-foreground">
                        Scanned {opportunity.scanned}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-snug font-semibold text-foreground">
                      {opportunity.title}
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-[0.65rem] text-muted-foreground">
                      <span className="font-medium text-foreground/70">
                        {opportunity.domain}
                      </span>
                      <span>·</span>
                      <span>DA {opportunity.da}</span>
                      <span>·</span>
                      <span>{opportunity.traffic}</span>
                    </div>
                  </div>
                  <div className="shrink-0 rounded-full bg-[var(--color-blaze-orange)]/12 px-2.5 py-1 text-sm font-bold text-[var(--color-blaze-orange-2)] tabular-nums">
                    {opportunity.score}
                  </div>
                </div>

                {/* Outreach draft */}
                <div className="m-4 mt-2.5 rounded-xl border border-[var(--color-border)] bg-background/60">
                  <div className="border-b border-[var(--color-border)] px-3 py-2">
                    <p className="text-[0.56rem] font-semibold tracking-[0.14em] text-muted-foreground/70 uppercase">
                      Outreach draft
                    </p>
                  </div>
                  <div className="space-y-1.5 px-3 py-2.5 text-xs">
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[0.6rem] font-semibold tracking-wide text-muted-foreground/60 uppercase">
                        To
                      </span>
                      <span className="text-muted-foreground">
                        {opportunity.draft.to}
                      </span>
                    </div>
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 text-[0.6rem] font-semibold tracking-wide text-muted-foreground/60 uppercase">
                        Subject
                      </span>
                      <span className="font-medium text-foreground">
                        {opportunity.draft.subject}
                      </span>
                    </div>
                  </div>
                  <div className="border-t border-[var(--color-border)] px-3 py-2.5">
                    <p className="line-clamp-3 text-xs leading-5 whitespace-pre-line text-muted-foreground">
                      {opportunity.draft.body}
                    </p>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="mt-3.5 flex items-center justify-between border-t border-[var(--color-border)] pt-3.5 text-[0.63rem] text-muted-foreground">
                <span>Updated daily · Refreshes in 6h 14m</span>
                <span className="font-semibold text-[var(--color-princeton-orange)]">
                  View all 18 →
                </span>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
