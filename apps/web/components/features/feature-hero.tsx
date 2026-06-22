"use client"

import { IconArrowRight } from "@tabler/icons-react"
import { motion, useInView } from "framer-motion"
import Link from "next/link"
import { useEffect, useRef, useState } from "react"

import { IconBrandChatGPT } from "@/components/custom-icons/brand-chatgpt"
import { IconBrandClaude } from "@/components/custom-icons/brand-claude"
import { IconBrandGemini } from "@/components/custom-icons/brand-gemini"
import IconBrandPerplexity from "@/components/custom-icons/brand-perplexity"
import type { FeaturePage } from "@/consts/features"
import { Button } from "@workspace/ui/components/button"

// ─── Count-up hook (local) ────────────────────────────────────────────────────

function useCountUp(target: number, duration = 1800, enabled = true) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!enabled || target === 0) {
      setCount(target)
      return
    }
    let startTime: number | null = null
    function step(ts: number) {
      if (!startTime) startTime = ts
      const progress = Math.min((ts - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(target * eased))
      if (progress < 1) requestAnimationFrame(step)
      else setCount(target)
    }
    requestAnimationFrame(step)
  }, [target, duration, enabled])

  return count
}

// ─── Stat item ────────────────────────────────────────────────────────────────

function StatItem({
  stat,
  index,
  animate,
}: {
  stat: FeaturePage["heroStats"][number]
  index: number
  animate: boolean
}) {
  const raw = useCountUp(stat.value, 1600, animate && stat.value > 0)
  const display = animate ? raw.toLocaleString() : stat.value.toLocaleString()

  return (
    <motion.div
      className="flex flex-col items-center text-center text-white sm:px-12"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.65,
        delay: 0.15 + index * 0.13,
        ease: [0.21, 0.47, 0.32, 0.98],
      }}
    >
      <p className="font-heading text-7xl font-black tracking-tight tabular-nums sm:text-[5.5rem]">
        {display}
        <span className="text-5xl sm:text-[3.5rem]">{stat.suffix}</span>
      </p>
      <p
        className="mt-4 text-sm font-medium leading-relaxed whitespace-pre-line"
        style={{ color: "rgba(255,255,255,0.68)" }}
      >
        {stat.label}
      </p>
    </motion.div>
  )
}

// ─── Stats band ───────────────────────────────────────────────────────────────

function StatsBand({ stats }: { stats: FeaturePage["heroStats"] }) {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      className="relative w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.5, ease: [0.21, 0.47, 0.32, 0.98] }}
      style={{
        background:
          "linear-gradient(135deg, var(--crimson-carrot) 0%, var(--blaze-orange) 28%, var(--pumpkin-spice) 60%, var(--harvest-orange) 100%)",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(255,182,0,0.38) 0%, transparent 65%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 70% at 50% 130%, rgba(160,30,0,0.32) 0%, transparent 65%)",
        }}
      />
      <div className="container relative mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="grid grid-cols-1 gap-12 sm:grid-cols-3 sm:gap-0 sm:divide-x sm:divide-white/15">
          {stats.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} animate={isInView} />
          ))}
        </div>
      </div>
    </motion.div>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

const ease = [0.21, 0.47, 0.32, 0.98] as const

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
}

type Props = {
  feature: FeaturePage
}

export function FeatureHero({ feature }: Props) {
  // Split title to highlight the titleHighlight substring
  const idx = feature.title.indexOf(feature.titleHighlight)
  const before = idx >= 0 ? feature.title.slice(0, idx) : feature.title
  const highlight = idx >= 0 ? feature.titleHighlight : ""
  const after = idx >= 0 ? feature.title.slice(idx + feature.titleHighlight.length) : ""

  return (
    <section className="relative overflow-hidden bg-background">
      {/* Atmosphere */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute left-1/2 top-0 h-[700px] w-[1000px] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/8 blur-[150px]" />
        <div className="absolute right-0 top-1/3 h-[280px] w-[280px] rounded-full bg-[var(--color-amber-flame)]/5 blur-[90px]" />
        <div className="absolute left-0 top-2/3 h-[240px] w-[240px] rounded-full bg-[var(--color-blaze-orange)]/5 blur-[90px]" />
      </div>

      {/* Content */}
      <div className="relative flex min-h-screen items-center">
        <div className="container mx-auto w-full px-4 py-24 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center">
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-3 rounded-full border border-border/60 bg-muted/50 px-5 py-2.5 backdrop-blur-sm"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.5, delay: 0, ease }}
            >
              <span className="text-[0.7rem] font-bold text-(--color-blaze-orange) uppercase">
                {feature.heroBadge}
              </span>
              <span className="h-4 w-px bg-border/60" />
              <div className="flex items-center gap-2">
                <IconBrandChatGPT className="h-[20px] w-[20px]" />
                <IconBrandClaude className="h-[20px] w-[20px]" />
                <IconBrandGemini className="h-[20px] w-[20px]" />
                <IconBrandPerplexity className="h-[20px] w-[20px]" />
              </div>
            </motion.div>

            {/* Heading */}
            <motion.h1
              className="mt-8 max-w-5xl font-heading text-5xl font-semibold tracking-[-0.05em] text-balance sm:text-6xl lg:text-[5.5rem] xl:text-[6rem]"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.6, delay: 0.08, ease }}
            >
              {before}
              {highlight && (
                <span className="bg-gradient-to-r from-[var(--color-blaze-orange-2)] via-[var(--color-harvest-orange)] to-[var(--color-amber-flame)] bg-clip-text text-transparent">
                  {highlight}
                </span>
              )}
              {after}
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              className="mx-auto mt-6 max-w-2xl text-base font-medium leading-7 text-muted-foreground sm:text-lg sm:leading-8"
              variants={fadeUp}
              initial="initial"
              animate="animate"
              transition={{ duration: 0.55, delay: 0.16, ease }}
            >
              {feature.description}
            </motion.p>

            {/* CTAs */}
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
                className="group h-14 rounded-full px-9 text-base font-bold shadow-xl shadow-primary/30 transition-all duration-300 hover:-translate-y-0.5 hover:scale-[1.02] hover:shadow-2xl hover:shadow-primary/40 active:scale-[0.99]"
              >
                <Link href="/signup">
                  {feature.primaryCta}
                  <IconArrowRight className="ml-2 h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="h-14 rounded-full border-border/60 bg-background/70 px-8 text-base backdrop-blur transition-colors hover:border-[var(--color-princeton-orange)]/40 hover:bg-[var(--color-blaze-orange)]/8"
              >
                <Link href="#how-it-works">{feature.secondaryCta}</Link>
              </Button>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Stats band */}
      <StatsBand stats={feature.heroStats} />
    </section>
  )
}
