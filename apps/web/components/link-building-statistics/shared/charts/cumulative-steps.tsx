"use client"

import { CHART_FONT, seqVar } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { barUp, num } from "../svg-geometry"

const W = 700
const H = 300
const PAD_TOP = 50
const PAD_BOTTOM = 54
const GAP = 44
const Y_MAX = 0.52

const PLOT_H = H - PAD_TOP - PAD_BOTTOM
const BASELINE = PAD_TOP + PLOT_H

/**
 * Cumulative reach rather than per-step reply rate. Per-step rates flatter later
 * follow-ups, because only the least responsive prospects are still in the
 * sequence by then — the honest question is what share of contacted prospects had
 * answered by the end of each step, and how much each extra step adds.
 */
export function CumulativeSteps({
  data,
  denominator,
}: {
  data: { label: string; replies: number }[]
  denominator: number
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()

  const colW = (W - GAP * (data.length - 1)) / data.length

  const bars = data.map((d, index) => {
    const share = denominator > 0 ? d.replies / denominator : 0
    const height = (Math.min(share, Y_MAX) / Y_MAX) * PLOT_H
    return {
      ...d,
      share,
      height,
      x: index * (colW + GAP),
      top: BASELINE - height,
    }
  })

  const stepLine = bars
    .flatMap((bar, index) => {
      const next = bars[index + 1]
      return next
        ? [`${bar.x + colW},${bar.top}`, `${next.x},${bar.top}`, `${next.x},${next.top}`]
        : []
    })
    .join(" ")

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={520}>
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

        <polyline
          points={stepLine}
          fill="none"
          stroke="var(--lbs-ink-3)"
          strokeWidth={1.25}
          strokeDasharray="4 4"
        />

        {bars.map((bar, index) => {
          const color = seqVar(index, bars.length)
          const previous = bars[index - 1]
          const delta = previous ? bar.share - previous.share : null

          return (
            <g key={bar.label}>
              <path d={barUp(bar.x, BASELINE, colW, bar.height)} fill={color} />

              <text
                x={bar.x + colW / 2}
                y={bar.top + 26}
                textAnchor="middle"
                fontSize={19}
                fontWeight={700}
                fill="#ffffff"
              >
                {(bar.share * 100).toFixed(1)}%
              </text>

              {delta !== null && previous ? (
                <text
                  x={previous.x + colW + GAP / 2}
                  y={bar.top - 12}
                  textAnchor="middle"
                  fontSize={13}
                  fontWeight={700}
                  fill="var(--lbs-ink-2)"
                >
                  +{(delta * 100).toFixed(1)}pt
                </text>
              ) : null}

              <text
                x={bar.x + colW / 2}
                y={BASELINE + 22}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill="var(--lbs-ink)"
              >
                {bar.label}
              </text>
              <text
                x={bar.x + colW / 2}
                y={BASELINE + 39}
                textAnchor="middle"
                fontSize={11.5}
                fill="var(--lbs-ink-2)"
              >
                {num(bar.replies)} of {num(denominator)}
              </text>

              <rect
                x={bar.x}
                y={PAD_TOP}
                width={colW}
                height={PLOT_H}
                fill="transparent"
                onMouseMove={(event) =>
                  show(event, {
                    title: bar.label,
                    swatch: color,
                    rows: [
                      {
                        label: "Prospects replied",
                        value: `${(bar.share * 100).toFixed(1)}%`,
                      },
                      { label: "Count", value: num(bar.replies) },
                      ...(delta !== null
                        ? [
                            {
                              label: "Added by this step",
                              value: `+${(delta * 100).toFixed(1)}pt`,
                            },
                          ]
                        : []),
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
