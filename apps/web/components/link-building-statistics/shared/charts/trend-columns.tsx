"use client"

import { CHART_FONT, seqVar } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { barUp, num, pct } from "../svg-geometry"

const W = 700
const H = 268
const PAD_TOP = 32
const PAD_BOTTOM = 48
const GAP = 60

const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + PLOT_H

/**
 * Fallback for `TrendLine` while there are too few months to draw a
 * trend line honestly — a line through two or three points implies a
 * trajectory the data can't yet support. Columns make the same reply-rate
 * comparison without that implication; `ChartBody` switches to this below
 * four months and back to `TrendLine` once there's enough history.
 */
export function TrendColumns({
  data,
}: {
  data: { label: string; sends: number; replies: number }[]
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()

  const rates = data.map((d) => (d.sends > 0 ? d.replies / d.sends : 0))
  const max = Math.max(...rates, 0.01)
  const colW = (W - GAP * (data.length - 1)) / data.length

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={420}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        fontFamily={CHART_FONT}
        onMouseLeave={hide}
      >
        <line
          x1={0}
          y1={BASELINE}
          x2={W}
          y2={BASELINE}
          stroke="var(--lbs-grid)"
          strokeWidth={1}
        />

        {data.map((d, index) => {
          const rate = rates[index] as number
          const x = index * (colW + GAP)
          const barH = (rate / max) * PLOT_H
          const color = seqVar(index, data.length)

          return (
            <g key={d.label}>
              <path d={barUp(x, BASELINE, colW, barH)} fill={color} />

              <text
                x={x + colW / 2}
                y={BASELINE - barH - 10}
                textAnchor="middle"
                fontSize={16}
                fontWeight={700}
                fill="var(--lbs-ink)"
              >
                {pct(rate)}
              </text>

              <text
                x={x + colW / 2}
                y={BASELINE + 20}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="var(--lbs-ink)"
              >
                {d.label}
              </text>
              <text
                x={x + colW / 2}
                y={BASELINE + 37}
                textAnchor="middle"
                fontSize={11.5}
                fill="var(--lbs-ink-2)"
              >
                {num(d.replies)} of {num(d.sends)} sent
              </text>

              <rect
                x={x}
                y={PAD_TOP}
                width={colW}
                height={PLOT_H}
                fill="transparent"
                onMouseMove={(event) =>
                  show(event, {
                    title: d.label,
                    swatch: color,
                    rows: [
                      { label: "Reply rate", value: pct(rate) },
                      { label: "Replies", value: num(d.replies) },
                      { label: "Emails sent", value: num(d.sends) },
                    ],
                  })
                }
              />
            </g>
          )
        })}
      </svg>
    </ChartCanvas>
  )
}
