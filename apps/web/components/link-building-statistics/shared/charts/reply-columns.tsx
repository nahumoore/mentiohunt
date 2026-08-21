"use client"

import { CHART_FONT, seqVar } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { barUp, num } from "../svg-geometry"

const W = 700
const H = 268
const PAD_TOP = 32
const PAD_BOTTOM = 48
const GAP = 18

const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + PLOT_H

/**
 * Distribution across ordered time buckets — columns, because the buckets have a
 * natural left-to-right order and the question is "where does the mass sit".
 * Share is direct-labelled on every column; the raw count sits under the axis so
 * the two numbers never compete.
 */
export function ReplyColumns({
  data,
  unit = "replies",
}: {
  data: { label: string; count: number }[]
  unit?: string
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const max = Math.max(...data.map((d) => d.count), 1)
  const colW = (W - GAP * (data.length - 1)) / data.length

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={480}>
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
          const x = index * (colW + GAP)
          const barH = (d.count / max) * PLOT_H
          const share = total > 0 ? d.count / total : 0
          const color = seqVar(data.length - 1 - index, data.length)

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
                {Math.round(share * 100)}%
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
                {num(d.count)} {unit}
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
                      { label: "Share", value: `${(share * 100).toFixed(1)}%` },
                      { label: `First ${unit}`, value: num(d.count) },
                      { label: "Of total", value: num(total) },
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
