"use client"

import type { BucketStat } from "@/content/link-building-statistics/types"

import { CHART_FONT, seqVar } from "../chart-tokens"
import { ChartCanvas, useChartTooltip } from "../chart-tooltip"
import { MIN_SAMPLE_SIZE } from "../constants"
import { barRight, num, pct } from "../svg-geometry"

const W = 700
const ROW_H = 46
const BAR_H = 12
const LABEL_BASELINE = 13
const BAR_TOP = 22

/**
 * Horizontal bars for "reply rate by <bucket>". One series, so no legend — every
 * bar is directly labelled with its rate and its raw n, which is also the relief
 * the palette validator requires for the palest ramp steps.
 *
 * Buckets under the minimum sample size are not given a rate at all: a hatched
 * track and an explicit "insufficient sample" note, so a thin segment can never
 * be misread as a real finding.
 */
export function RateBars({
  data,
  minSample = MIN_SAMPLE_SIZE,
  hatchId,
}: {
  data: BucketStat[]
  minSample?: number
  hatchId: string
}) {
  const { containerRef, tooltip, show, hide } = useChartTooltip()

  const rates = data.map((d) => (d.sends > 0 ? d.replies / d.sends : 0))
  const scaleMax = Math.max(
    ...data.map((d, i) => (d.sends < minSample ? 0 : (rates[i] as number))),
    0.01
  )
  const height = data.length * ROW_H

  return (
    <ChartCanvas containerRef={containerRef} tooltip={tooltip} minWidth={470}>
      <svg
        viewBox={`0 0 ${W} ${height}`}
        width="100%"
        height="auto"
        role="img"
        fontFamily={CHART_FONT}
        onMouseLeave={hide}
      >
        <defs>
          <pattern
            id={hatchId}
            width="7"
            height="7"
            patternTransform="rotate(135)"
            patternUnits="userSpaceOnUse"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="7"
              stroke="var(--lbs-ink-3)"
              strokeWidth="1.5"
              opacity="0.35"
            />
          </pattern>
        </defs>

        {data.map((bucket, index) => {
          const top = index * ROW_H
          const gated = bucket.sends < minSample
          const rateValue = rates[index] as number
          const width = gated ? 0 : (rateValue / scaleMax) * W

          return (
            <g key={bucket.label}>
              <text
                x={0}
                y={top + LABEL_BASELINE}
                fontSize={14}
                fontWeight={600}
                fill="var(--lbs-ink)"
              >
                {bucket.label}
              </text>

              {gated ? (
                <text
                  x={W}
                  y={top + LABEL_BASELINE}
                  textAnchor="end"
                  fontSize={12}
                  fontStyle="italic"
                  fill="var(--lbs-ink-3)"
                >
                  Insufficient sample (n={bucket.sends})
                </text>
              ) : (
                <text x={W} y={top + LABEL_BASELINE} textAnchor="end">
                  <tspan fontSize={12} fill="var(--lbs-ink-2)">
                    {num(bucket.replies)} / {num(bucket.sends)}
                  </tspan>
                  <tspan
                    dx={10}
                    fontSize={15}
                    fontWeight={700}
                    fill="var(--lbs-ink)"
                  >
                    {pct(rateValue)}
                  </tspan>
                </text>
              )}

              <rect
                x={0}
                y={top + BAR_TOP}
                width={W}
                height={BAR_H}
                rx={4}
                fill="var(--lbs-track)"
              />

              {gated ? (
                <rect
                  x={0}
                  y={top + BAR_TOP}
                  width={W}
                  height={BAR_H}
                  rx={4}
                  fill={`url(#${hatchId})`}
                />
              ) : (
                <path
                  d={barRight(0, top + BAR_TOP, width, BAR_H)}
                  fill={seqVar(index, data.length)}
                />
              )}

              <rect
                x={0}
                y={top}
                width={W}
                height={ROW_H}
                fill="transparent"
                onMouseMove={(event) =>
                  show(event, {
                    title: bucket.label,
                    swatch: gated ? undefined : seqVar(index, data.length),
                    rows: gated
                      ? [
                          { label: "Emails sent", value: num(bucket.sends) },
                          {
                            label: "Status",
                            value: `Below n=${minSample}`,
                          },
                        ]
                      : [
                          { label: "Reply rate", value: pct(rateValue) },
                          { label: "Replies", value: num(bucket.replies) },
                          { label: "Emails sent", value: num(bucket.sends) },
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
