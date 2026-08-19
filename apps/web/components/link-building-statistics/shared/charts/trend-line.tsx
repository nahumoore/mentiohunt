"use client"

import { useState } from "react"

import { CHART_FONT } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { num, pct } from "../svg-geometry"

const W = 700
const H = 290
const PAD_L = 44
const PAD_R = 16
const PAD_T = 26
const PAD_B = 46

const PLOT_W = W - PAD_L - PAD_R
const PLOT_H = H - PAD_T - PAD_B
const Y_MAX = 0.32
const TICKS = [0, 0.08, 0.16, 0.24, 0.32]

/**
 * Change over time — one series, so no legend box: the chart title names it. Only
 * the first and last points carry a value label; the rest are read off the
 * crosshair, which is why the hover layer is not optional here.
 */
export function TrendLine({
  data,
  gradientId,
  year,
}: {
  data: { label: string; sends: number; replies: number }[]
  gradientId: string
  year: number
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  const points = data.map((d, index) => {
    const rate = d.sends > 0 ? d.replies / d.sends : 0
    return {
      ...d,
      rate,
      x: PAD_L + (index / Math.max(data.length - 1, 1)) * PLOT_W,
      y: PAD_T + PLOT_H - (Math.min(rate, Y_MAX) / Y_MAX) * PLOT_H,
    }
  })

  const baseline = PAD_T + PLOT_H
  const line = points.map((p) => `${p.x},${p.y}`).join(" ")
  const area = [
    `M${PAD_L},${baseline}`,
    ...points.map((p) => `L${p.x},${p.y}`),
    `L${PAD_L + PLOT_W},${baseline}`,
    "Z",
  ].join(" ")

  function handleMove(event: React.MouseEvent<SVGRectElement>) {
    const bounds = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - bounds.left) / bounds.width
    const index = Math.min(
      data.length - 1,
      Math.max(0, Math.round(ratio * (data.length - 1)))
    )
    const point = points[index]
    if (!point) return
    setActiveIndex(index)
    show(event, {
      title: `${point.label} ${year}`,
      swatch: "var(--lbs-accent)",
      rows: [
        { label: "Reply rate", value: pct(point.rate) },
        { label: "Replies", value: num(point.replies) },
        { label: "Emails sent", value: num(point.sends) },
      ],
    })
  }

  function handleLeave() {
    setActiveIndex(null)
    hide()
  }

  const active = activeIndex === null ? null : points[activeIndex]

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={480}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        fontFamily={CHART_FONT}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--lbs-accent)" stopOpacity="0.22" />
            <stop offset="100%" stopColor="var(--lbs-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>

        {TICKS.map((tick) => {
          const y = PAD_T + PLOT_H - (tick / Y_MAX) * PLOT_H
          return (
            <g key={tick}>
              <line
                x1={PAD_L}
                y1={y}
                x2={PAD_L + PLOT_W}
                y2={y}
                stroke="var(--lbs-grid)"
                strokeWidth={1}
              />
              <text
                x={PAD_L - 10}
                y={y + 4}
                textAnchor="end"
                fontSize={11}
                fill="var(--lbs-ink-3)"
              >
                {Math.round(tick * 100)}%
              </text>
            </g>
          )
        })}

        <path d={area} fill={`url(#${gradientId})`} />
        <polyline
          points={line}
          fill="none"
          stroke="var(--lbs-accent)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {active ? (
          <line
            x1={active.x}
            y1={PAD_T}
            x2={active.x}
            y2={PAD_T + PLOT_H}
            stroke="var(--lbs-ink-3)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        ) : null}

        {points.map((p, index) => (
          <g key={p.label}>
            <circle
              cx={p.x}
              cy={p.y}
              r={activeIndex === index ? 5.5 : 4}
              fill="var(--lbs-accent)"
              stroke="var(--lbs-surface)"
              strokeWidth={2}
            />
            <text
              x={p.x}
              y={H - PAD_B + 22}
              textAnchor="middle"
              fontSize={12}
              fill="var(--lbs-ink-2)"
            >
              {p.label}
            </text>
          </g>
        ))}

        {[points[0], points[points.length - 1]].map((p, i) =>
          p ? (
            <text
              key={`label-${i}`}
              x={p.x}
              y={p.y - 14}
              textAnchor={i === 0 ? "start" : "end"}
              fontSize={14}
              fontWeight={700}
              fill="var(--lbs-ink)"
            >
              {pct(p.rate)}
            </text>
          ) : null
        )}

        <rect
          x={PAD_L}
          y={PAD_T}
          width={PLOT_W}
          height={PLOT_H}
          fill="transparent"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
      </svg>
    </ChartCanvas>
  )
}
