"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { motion } from "framer-motion"
import Link from "next/link"

import { Button } from "@workspace/ui/components/button"
import type { MonitoringConfig } from "@/consts/community-monitoring"

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

export function MonitoringCta({ config }: { config: MonitoringConfig }) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-28">
      {/* Decorative lines */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/25 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/15 to-transparent" />

      {/* Center glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-blaze-orange)]/7 blur-[110px]" />
        <div className="absolute top-1/2 left-1/2 h-[16rem] w-[16rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/10 blur-[60px]" />
      </div>

      <div className="relative container mx-auto px-4 text-center sm:px-6 lg:px-8">
        <motion.div
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, ease }}
        >
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Start for free
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
        </motion.div>

        <motion.h2
          className="mx-auto mt-5 max-w-2xl font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]"
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.08, ease }}
        >
          Never miss a relevant {config.name} conversation again
        </motion.h2>

        <motion.p
          className="mx-auto mt-4 max-w-xl text-base leading-7 text-muted-foreground sm:text-lg"
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.16, ease }}
        >
          Set up your keyword queue in minutes. Mentiohunt handles the monitoring
          and surfaces the posts worth your time.
        </motion.p>

        <motion.div
          className="mt-10"
          variants={fadeUp}
          initial="initial"
          whileInView="animate"
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.24, ease }}
        >
          <Button
            asChild
            size="lg"
            className="group rounded-full px-10 text-base font-bold shadow-xl shadow-primary/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-2xl hover:shadow-primary/35 active:scale-[0.99]"
          >
            <Link href="/signup">
              {config.hero.primaryCta}
              <IconArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  )
}
