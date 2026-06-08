"use client"

import { IconMessageCircle, IconRadar2, IconSearch } from "@tabler/icons-react"
import { motion } from "framer-motion"

import type { MonitoringConfig } from "@/consts/community-monitoring"

const stepIcons = [IconSearch, IconRadar2, IconMessageCircle] as const

const ease = [0.21, 0.47, 0.32, 0.98] as const

export function MonitoringHowItWorks({ config }: { config: MonitoringConfig }) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-16 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[120px]" />
        <div className="absolute right-0 bottom-0 h-[22rem] w-[22rem] translate-x-1/3 translate-y-1/4 rounded-full bg-[var(--color-amber-flame)]/7 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold tracking-[0.24em] text-(--color-blaze-orange) uppercase">
            How it works
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            From keywords to reply queue in three steps
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Set your targeting once. Mentiohunt handles the scanning and surfaces
            relevant {config.name} posts daily.
          </p>
        </div>

        {/* Steps */}
        <div className="mx-auto mt-14 max-w-6xl">
          <div className="grid gap-8 sm:gap-6 lg:grid-cols-3">
            {config.steps.map((step, index) => {
              const Icon = stepIcons[index] ?? IconSearch
              const num = String(index + 1).padStart(2, "0")

              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.5, delay: index * 0.1, ease }}
                  className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-[var(--color-blaze-orange)]/30"
                >
                  {/* Top accent */}
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/0 to-transparent transition-all duration-300 group-hover:via-[var(--color-blaze-orange)]/40" />

                  {/* Number + icon row */}
                  <div className="mb-5 flex items-center justify-between">
                    <span className="font-heading text-4xl font-bold tabular-nums text-[var(--color-blaze-orange)]/25 transition-colors duration-200 group-hover:text-[var(--color-blaze-orange)]/40">
                      {num}
                    </span>
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]">
                      <Icon className="h-5 w-5" />
                    </div>
                  </div>

                  <h3 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                    {step.desc}
                  </p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
