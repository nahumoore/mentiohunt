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
    <section className="relative overflow-hidden bg-background pb-16 pt-16 sm:pb-20 sm:pt-20 lg:pb-24 lg:pt-28">
      {/* Ambient blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/4 h-[40rem] w-[40rem] rounded-full bg-[var(--color-princeton-orange)]/7 blur-[130px]" />
        <div className="absolute bottom-0 right-0 h-[28rem] w-[28rem] translate-x-1/3 translate-y-1/4 rounded-full bg-[var(--color-amber-flame)]/8 blur-[100px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16 xl:gap-20">
          {/* Left: copy */}
          <div>
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

            <motion.h1
              className="mt-6 font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl lg:text-[3.15rem] xl:text-[3.6rem]"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.08, ease }}
            >
              {config.hero.heading}
            </motion.h1>

            <motion.p
              className="mt-5 max-w-xl text-base font-medium leading-7 text-muted-foreground sm:text-lg sm:leading-8"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, delay: 0.16, ease }}
            >
              {config.hero.sub}
            </motion.p>

            <motion.div
              className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, delay: 0.24, ease }}
            >
              <Button
                asChild
                size="lg"
                className="group rounded-full px-8 text-base font-bold shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/35 active:scale-[0.99]"
              >
                <Link href="/signup">
                  {config.hero.primaryCta}
                  <IconArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <p className="text-sm text-muted-foreground">
                No credit card required
              </p>
            </motion.div>
          </div>

          {/* Right: feed preview */}
          <motion.div
            initial={{ opacity: 0, y: 36, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.18, ease }}
            className="relative"
          >
            <MonitoringFeedPreview config={config} />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
