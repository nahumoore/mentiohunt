"use client"

/** Static illustration for the hero right column — organic visibility growth chart. */

import {
  IconArrowUpRight,
  IconLink,
  IconTrendingUp,
} from "@tabler/icons-react"
import { motion, useReducedMotion } from "framer-motion"

const ease = [0.21, 0.47, 0.32, 0.98] as const

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
              +147%
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
          <path d={areaPath} fill="url(#ovc-area)" />
          <path
            d={linePath}
            fill="none"
            stroke="var(--color-blaze-orange)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <motion.circle
            cx="640"
            cy="40"
            r="7"
            fill="none"
            stroke="var(--color-blaze-orange)"
            strokeWidth="2"
            animate={
              reduceMotion
                ? undefined
                : { r: [7, 16, 7], opacity: [0.6, 0, 0.6] }
            }
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <circle cx="640" cy="40" r="6" fill="var(--color-blaze-orange)" />
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

      {/* Backlink markers */}
      <div className="relative mt-4 h-16">
        {markers.map((m) => (
          <div
            key={m.left}
            className="absolute flex -translate-x-1/2 flex-col items-center gap-1.5"
            style={{ left: `${m.left}%` }}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/8 text-(--color-blaze-orange)">
              <IconLink size={13} />
            </span>
            <span className="whitespace-nowrap rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground">
              +1 backlink
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  )
}
