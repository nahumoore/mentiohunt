"use client"

import { IconBolt, IconSparkles, IconSwitchHorizontal, IconTarget } from "@tabler/icons-react"
import { motion } from "framer-motion"

import type { MonitoringConfig } from "@/consts/community-monitoring"

const whyIcons = [IconBolt, IconSwitchHorizontal, IconTarget, IconSparkles] as const

const ease = [0.21, 0.47, 0.32, 0.98] as const

export function MonitoringWhy({ config }: { config: MonitoringConfig }) {
  return (
    <section className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute bottom-0 left-0 h-[30rem] w-[30rem] -translate-x-1/3 rounded-full bg-[var(--color-princeton-orange)]/6 blur-[110px]" />
        <div className="absolute top-1/4 right-0 h-[24rem] w-[24rem] translate-x-1/4 rounded-full bg-[var(--color-amber-flame)]/7 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
            Why monitor {config.name}
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2 className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]">
            Built for founders who reply, not just lurk
          </h2>
          <p className="mt-4 text-base leading-7 text-muted-foreground sm:text-lg">
            Every feature is oriented around one question: is this post worth replying to right now?
          </p>
        </div>

        {/* Cards */}
        <div className="mx-auto mt-14 max-w-6xl grid gap-px bg-border/70 overflow-hidden rounded-2xl sm:grid-cols-2">
          {config.why.map((item, index) => {
            const Icon = whyIcons[index] ?? IconBolt

            return (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.45, delay: index * 0.08, ease }}
                className="group flex flex-col gap-4 bg-background p-8 transition-colors duration-200 hover:bg-[var(--color-blaze-orange)]/3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--color-blaze-orange)]/10 text-[var(--color-blaze-orange)] transition-colors duration-200 group-hover:bg-[var(--color-blaze-orange)]/15">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground sm:text-lg">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
