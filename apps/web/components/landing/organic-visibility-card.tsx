"use client"

/** Illustration for the hero right column — organic visibility growth chart, animated once on load. */

import {
  IconArrowUpRight,
  IconLink,
  IconTrendingUp,
} from "@tabler/icons-react"
import { motion, useReducedMotion } from "framer-motion"
import { useEffect, useState } from "react"

const ease = [0.21, 0.47, 0.32, 0.98] as const

// Line-draw + count-up timing — kept in sync so the % and markers land as the line passes them.
const DRAW_DELAY = 0.5
const DRAW_DURATION = 1.8

function useCountUp(target: number, duration: number, delay: number, skip: boolean) {
  const [value, setValue] = useState(skip ? target : 0)

  useEffect(() => {
    if (skip) return
    let raf: number
    let start: number | null = null
    const timeout = setTimeout(() => {
      const step = (ts: number) => {
        if (start === null) start = ts
        const progress = Math.min((ts - start) / (duration * 1000), 1)
        setValue(Math.round(progress * target))
        if (progress < 1) raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }, delay * 1000)
    return () => {
      clearTimeout(timeout)
      cancelAnimationFrame(raf)
    }
  }, [target, duration, delay, skip])

  return value
}

// Chart geometry — hand-authored points across a 640x220 viewBox.
const points: [number, number][] = [
  [0, 190],
  [80, 182],
  [160, 186],
  [240, 162],
  [320, 168],
  [400, 138],
  [480, 145],
  [560, 105],
  [640, 40],
]
const linePath = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ")
const areaPath = `${linePath} L640,220 L0,220 Z`

const markers = [
  { left: 37.5 },
  { left: 62.5 },
  { left: 87.5 },
]

export function OrganicVisibilityCard() {
  const reduceMotion = useReducedMotion()
  const percent = useCountUp(147, DRAW_DURATION, DRAW_DELAY, !!reduceMotion)

  return (
    <motion.div
      className="mx-auto w-full max-w-xl"
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.7, delay: 0.25, ease }}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
            <IconTrendingUp size={20} />
          </span>
          <div>
            <p className="text-sm font-semibold text-foreground">
              Organic visibility
            </p>
            <p className="mt-0.5 flex items-center gap-1 font-heading text-3xl font-bold text-(--color-blaze-orange)">
              +{percent}%
              <IconArrowUpRight size={18} />
            </p>
          </div>
        </div>
        <span className="inline-flex shrink-0 items-center rounded-full border border-border/60 px-3 py-1.5 text-xs font-medium text-muted-foreground">
          Last 30 days
        </span>
      </div>

      {/* Chart — grid lines live inside this box only, so they never bleed into the rows below */}
      <div className="relative mt-7">
        <svg
          viewBox="0 0 640 220"
          className="w-full overflow-visible"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="ovc-area" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--color-blaze-orange)"
                stopOpacity="0.22"
              />
              <stop
                offset="100%"
                stopColor="var(--color-blaze-orange)"
                stopOpacity="0"
              />
            </linearGradient>
          </defs>
          <motion.path
            d={areaPath}
            fill="url(#ovc-area)"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: DRAW_DURATION, delay: DRAW_DELAY, ease: "linear" }}
          />
          <motion.path
            d={linePath}
            fill="none"
            stroke="var(--color-blaze-orange)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={reduceMotion ? undefined : { pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: DRAW_DURATION, delay: DRAW_DELAY, ease: "linear" }}
          />
          <motion.circle
            cx="640"
            cy="40"
            r="7"
            fill="none"
            stroke="var(--color-blaze-orange)"
            strokeWidth="2"
            initial={reduceMotion ? undefined : { opacity: 0 }}
            animate={
              reduceMotion
                ? undefined
                : { opacity: [0, 0.6, 0, 0.6], r: [7, 7, 16, 7] }
            }
            transition={{
              duration: 2.2,
              delay: DRAW_DELAY + DRAW_DURATION,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.circle
            cx="640"
            cy="40"
            r="6"
            fill="var(--color-blaze-orange)"
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: DRAW_DELAY + DRAW_DURATION }}
            style={{ transformOrigin: "640px 40px" }}
          />
        </svg>

        {/* Grid lines — top-0/bottom-0 pins them to the svg's own box, not the section below.
            Masked to a soft fade at both ends so they don't cut off abruptly. */}
        {markers.map((m) => (
          <div
            key={m.left}
            className="absolute top-0 bottom-0 w-px border-l border-dashed border-(--color-blaze-orange)/25"
            style={{
              left: `${m.left}%`,
              maskImage:
                "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, transparent 0%, black 40%, black 60%, transparent 100%)",
            }}
          />
        ))}
      </div>

      {/* Backlink markers — each pops in the moment the line passes its x position */}
      <div className="relative mt-4 h-16">
        {markers.map((m) => (
          <motion.div
            key={m.left}
            className="absolute flex -translate-x-1/2 flex-col items-center gap-1.5"
            style={{ left: `${m.left}%` }}
            initial={reduceMotion ? undefined : { opacity: 0, scale: 0.4, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: DRAW_DELAY + DRAW_DURATION * (m.left / 100),
              ease: "backOut",
            }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/8 text-(--color-blaze-orange)">
              <IconLink size={13} />
            </span>
            <span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +1 backlink
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
