"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import type { MonitoringConfig } from "@/consts/community-monitoring"
import { MonitoringFeedPreview } from "./monitoring-feed-preview"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export function MonitoringHero({ config }: { config: MonitoringConfig }) {
  return (
    <section id="hero" className="relative overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/8 blur-[150px]" />
        <div className="absolute right-0 top-1/3 h-[280px] w-[280px] rounded-full bg-[var(--color-amber-flame)]/5 blur-[90px]" />
        <div className="absolute left-0 top-2/3 h-[240px] w-[240px] rounded-full bg-[var(--color-blaze-orange)]/5 blur-[90px]" />
      </div>

      {/* Centered copy */}
      <div className="relative flex min-h-[80vh] items-center">
        <div className="container mx-auto w-full px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Eyebrow badge */}
            <motion.div
              className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/50 px-4 py-2 backdrop-blur-sm"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.5, delay: 0, ease }}
            >
              <span className="text-[0.65rem] font-bold tracking-[0.22em] text-(--color-blaze-orange) uppercase">
                {config.hero.eyebrow}
              </span>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="mt-8 max-w-4xl font-heading text-5xl font-semibold tracking-[-0.04em] text-balance sm:text-6xl lg:text-[5rem] xl:text-[5.5rem]"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.08, ease }}
            >
              {config.hero.heading}
            </motion.h1>

            {/* Sub */}
            <motion.p
              className="mx-auto mt-5 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg sm:leading-8"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, delay: 0.16, ease }}
            >
              {config.hero.sub}
            </motion.p>

            {/* CTA */}
            <motion.div
              className="mt-10 flex flex-col items-center gap-3 sm:flex-row"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, delay: 0.24, ease }}
            >
              <Button
                asChild
                size="lg"
                className="group h-16 rounded-full px-10 text-lg font-bold shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.99]"
              >
                <Link href="/signup">
                  {config.hero.primaryCta}
                  <IconArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">No credit card required</p>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ticker */}
      <MonitoringFeedPreview config={config} />
    </section>
  )
}
