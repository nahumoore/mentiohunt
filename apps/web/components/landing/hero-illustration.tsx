"use client"

import { motion, useInView } from "framer-motion"
import { useEffect, useRef, useState } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const

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

type Stat = {
  value: number
  suffix: string
  label: string
  formatFn?: (n: number) => string
}

const stats: Stat[] = [
  {
    value: 1200,
    suffix: "+",
    label: "backlink opportunities\nsurfaced every month",
    formatFn: (n) => n.toLocaleString(),
  },
  {
    value: 91,
    suffix: "",
    label: "average fit score\nper opportunity",
  },
  {
    value: 0,
    suffix: " hrs",
    label: "outreach time\nrequired from you",
  },
]

function StatItem({
  stat,
  index,
  animate,
}: {
  stat: Stat
  index: number
  animate: boolean
}) {
  const raw = useCountUp(stat.value, 1600, animate && stat.value > 0)
  const display = stat.formatFn
    ? stat.formatFn(animate ? raw : stat.value)
    : (animate ? raw : stat.value).toString()

  return (
    <motion.div
      className="flex flex-col items-center text-center text-white sm:px-12"
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.65, delay: 0.15 + index * 0.13, ease }}
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

export function HeroIllustration() {
  const ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: "-80px" })

  return (
    <motion.div
      ref={ref}
      className="relative w-full overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.3, ease }}
      style={{
        background:
          "linear-gradient(135deg, var(--crimson-carrot) 0%, var(--blaze-orange) 28%, var(--pumpkin-spice) 60%, var(--harvest-orange) 100%)",
      }}
    >
      {/* warm glow from top */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -5%, rgba(255,182,0,0.38) 0%, transparent 65%)",
        }}
      />
      {/* depth shadow at bottom */}
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
