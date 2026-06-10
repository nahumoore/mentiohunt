"use client"

import { IconFlame, IconRocket, IconUsers } from "@tabler/icons-react"
import { motion } from "framer-motion"

import type { MonitoringConfig } from "@/consts/community-monitoring"

const useCaseIcons = [IconRocket, IconUsers, IconFlame] as const
const useCaseAccents = [
  "bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)]",
  "bg-[var(--color-deep-saffron)]/10 text-[var(--color-deep-saffron)]",
  "bg-[var(--color-amber-flame)]/10 text-[var(--color-amber-flame)]",
] as const

const ease = [0.21, 0.47, 0.32, 0.98] as const

export function MonitoringUseCases({ config }: { config: MonitoringConfig }) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-1/2 left-1/2 h-[36rem] w-[36rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--color-princeton-orange)]/5 blur-[130px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Who it is for
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Built for founders who move fast
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            {config.name} monitoring inside Mentiohunt is designed for small teams
            who want distribution without the overhead.
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-14 max-w-6xl grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {config.useCases.map((item, index) => {
            const Icon = useCaseIcons[index] ?? IconRocket
            const accent = useCaseAccents[index] ?? useCaseAccents[0]

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.1, ease }}
                className="group relative overflow-hidden rounded-2xl border border-border bg-card p-7 transition-colors duration-200 hover:border-[var(--color-blaze-orange)]/25 hover:bg-[var(--color-blaze-orange)]/2"
              >
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/0 to-transparent transition-all duration-300 group-hover:via-[var(--color-blaze-orange)]/30" />

                <div className={`mb-5 flex h-11 w-11 items-center justify-center rounded-2xl ${accent}`}>
                  <Icon className="h-5 w-5" />
                </div>

                <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">
                  {item.title}
                </h3>
                <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
                  {item.desc}
                </p>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
