"use client"

import { CHART_FONT, STATUS_VAR, type StatusTone } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { num } from "../svg-geometry"

const W = 700
const H = 112
const BAR_Y = 4
const BAR_H = 32
const SEGMENT_GAP = 3
const LEGEND_Y = 68

/**
 * Part-of-whole across three reserved status colours, so it carries secondary
 * encoding on purpose: each key gets its own *shape* (circle / square / triangle)
 * plus a written label, and the segments are separated by a surface gap. Nothing
 * here is distinguishable by hue alone.
 */
const TONE_SHAPE: Record<StatusTone, (cx: number, cy: number) => string> = {
  good: (cx, cy) => `M${cx - 5.5},${cy} a5.5,5.5 0 1 0 11,0 a5.5,5.5 0 1 0 -11,0`,
  info: (cx, cy) => `M${cx - 5},${cy - 5} h10 v10 h-10 Z`,
  bad: (cx, cy) => `M${cx},${cy - 6} L${cx + 6},${cy + 5} L${cx - 6},${cy + 5} Z`,
}

export function ClassificationBar({
  data,
}: {
  data: { label: string; count: number; tone: StatusTone }[]
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()

  const total = data.reduce((sum, d) => sum + d.count, 0)
  const legendColW = W / data.length

  // Segment start offsets, precomputed so the render pass stays free of mutation.
  const offsets = data.reduce<number[]>((acc, d, index) => {
    const previous = index === 0 ? 0 : (acc[index - 1] ?? 0)
    const previousWidth =
      index === 0 ? 0 : ((data[index - 1]?.count ?? 0) / (total || 1)) * W
    acc.push(previous + previousWidth)
    return acc
  }, [])

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={470}>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        height="auto"
        role="img"
        fontFamily={CHART_FONT}
        onMouseLeave={hide}
      >
        <rect x={0} y={BAR_Y} width={W} height={BAR_H} rx={5} fill="var(--lbs-track)" />

        {data.map((d, index) => {
          const share = total > 0 ? d.count / total : 0
          const rawWidth = share * W
          const x = offsets[index] ?? 0

          const isFirst = index === 0
          const isLast = index === data.length - 1
          const segX = isFirst ? x : x + SEGMENT_GAP / 2
          const segW = Math.max(
            rawWidth - (isFirst || isLast ? SEGMENT_GAP / 2 : SEGMENT_GAP),
            2
          )
          const color = STATUS_VAR[d.tone]

          return (
            <g key={d.label}>
              <rect
                x={segX}
                y={BAR_Y}
                width={segW}
                height={BAR_H}
                rx={5}
                fill={color}
              />
              {segW >= 52 ? (
                <text
                  x={segX + segW / 2}
                  y={BAR_Y + BAR_H / 2 + 5}
                  textAnchor="middle"
                  fontSize={14}
                  fontWeight={700}
                  fill="#ffffff"
                >
                  {Math.round(share * 100)}%
                </text>
              ) : null}
              <rect
                x={segX}
                y={BAR_Y}
                width={segW}
                height={BAR_H}
                fill="transparent"
                onMouseMove={(event) =>
                  show(event, {
                    title: d.label,
                    swatch: color,
                    rows: [
                      { label: "Share of replies", value: `${(share * 100).toFixed(1)}%` },
                      { label: "Messages", value: num(d.count) },
                    ],
                  })
                }
              />
            </g>
          )
        })}

        {data.map((d, index) => {
          const share = total > 0 ? d.count / total : 0
          const x = index * legendColW

          return (
            <g key={`legend-${d.label}`}>
              <path
                d={TONE_SHAPE[d.tone](x + 6, LEGEND_Y + 5)}
                fill={STATUS_VAR[d.tone]}
              />
              <text
                x={x + 20}
                y={LEGEND_Y + 10}
                fontSize={13.5}
                fontWeight={600}
                fill="var(--lbs-ink)"
              >
                {d.label}
              </text>
              <text x={x + 20} y={LEGEND_Y + 29} fontSize={12} fill="var(--lbs-ink-2)">
                {(share * 100).toFixed(1)}% · {num(d.count)} messages
              </text>
            </g>
          )
        })}
      </svg>
    </ChartCanvas>
  )
}
