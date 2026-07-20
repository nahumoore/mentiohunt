"use client"

import { IconChartLine } from "@tabler/icons-react"
import { useMemo, useRef, useState } from "react"

import { useOutreachActivityStore } from "@/stores/outreach-activity-store"
import { Card, CardContent, CardHeader } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import { buildContactedSeries, type ActivityGranularity } from "./_activity"

const GRANULARITY_OPTIONS: { value: ActivityGranularity; label: string }[] = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
]

// Horizontal inset (in viewBox units) so the first/last points have breathing
// room and their axis labels don't clip against the card edge.
const X_INSET = 4
const TOP_PAD = 10
const BOTTOM_PAD = 10

type ChartPoint = {
  x: number
  y: number
  count: number
  label: string
  fullDate: string
}

function buildSmoothPath(points: ChartPoint[]): string {
  if (points.length === 0) return ""
  if (points.length === 1) return `M ${points[0]!.x},${points[0]!.y}`

  const d = [`M ${points[0]!.x},${points[0]!.y}`]
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!
    const p1 = points[i]!
    const p2 = points[i + 1]!
    const p3 = points[Math.min(points.length - 1, i + 2)]!
    const t = 0.16
    const c1x = p1.x + (p2.x - p0.x) * t
    const c1y = p1.y + (p2.y - p0.y) * t
    const c2x = p2.x - (p3.x - p1.x) * t
    const c2y = p2.y - (p3.y - p1.y) * t
    d.push(`C ${c1x},${c1y} ${c2x},${c2y} ${p2.x},${p2.y}`)
  }
  return d.join(" ")
}

export function ContactedOverTime() {
  const sentAt = useOutreachActivityStore((state) => state.sentAt)
  const [granularity, setGranularity] = useState<ActivityGranularity>("day")
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const chartRef = useRef<HTMLDivElement>(null)

  const series = useMemo(
    () => buildContactedSeries(sentAt, granularity),
    [sentAt, granularity]
  )

  const { points, linePath, areaPath, total, maxCount } = useMemo(() => {
    const values = series.map((bucket) => bucket.count)
    const max = Math.max(1, ...values)
    const n = series.length
    const usableHeight = 100 - TOP_PAD - BOTTOM_PAD

    const pts: ChartPoint[] = series.map((bucket, i) => ({
      x: n <= 1 ? 50 : X_INSET + (i / (n - 1)) * (100 - X_INSET * 2),
      y: TOP_PAD + (1 - bucket.count / max) * usableHeight,
      count: bucket.count,
      label: bucket.label,
      fullDate: bucket.start.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
    }))

    const line = buildSmoothPath(pts)
    const first = pts[0]
    const last = pts[pts.length - 1]
    const area =
      line && first && last
        ? `${line} L ${last.x},100 L ${first.x},100 Z`
        : ""

    return {
      points: pts,
      linePath: line,
      areaPath: area,
      total: values.reduce((sum, value) => sum + value, 0),
      maxCount: max,
    }
  }, [series])

  // Thin out axis labels when there are many buckets (e.g. 14 days).
  const labelStep = points.length > 8 ? 2 : 1
  const usableHeight = 100 - TOP_PAD - BOTTOM_PAD
  const yAxisTicks = [
    { y: TOP_PAD, value: maxCount },
    { y: TOP_PAD + usableHeight / 2, value: Math.round(maxCount / 2) },
    { y: TOP_PAD + usableHeight, value: 0 },
  ]
  const hoveredPoint = hoveredIndex !== null ? points[hoveredIndex] : null

  function handlePointerMove(e: React.MouseEvent<HTMLDivElement>) {
    if (points.length === 0) return
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return
    const relX = ((e.clientX - rect.left) / rect.width) * 100

    let nearest = 0
    let minDist = Infinity
    points.forEach((point, i) => {
      const dist = Math.abs(point.x - relX)
      if (dist < minDist) {
        minDist = dist
        nearest = i
      }
    })
    setHoveredIndex(nearest)
  }

  return (
    <Card>
      <CardHeader className="flex items-start justify-between space-y-0">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex size-9 items-center justify-center rounded-xl bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
            <IconChartLine className="size-5" />
          </span>
          <div>
            <h3 className="font-heading text-base font-semibold text-foreground">
              Prospects contacted
            </h3>
            <p className="mt-0.5 text-sm text-muted-foreground">
              <span className="font-semibold tabular-nums text-foreground">
                {total}
              </span>{" "}
              sent · last {granularity === "day" ? "14 days" : "8 weeks"}
            </p>
          </div>
        </div>
        <div className="inline-flex shrink-0 items-center rounded-lg bg-muted/60 p-1">
          {GRANULARITY_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setGranularity(option.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                granularity === option.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </CardHeader>
      <CardContent>
        {sentAt.length === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-border text-center">
            <IconChartLine className="size-6 text-muted-foreground/60" />
            <p className="max-w-xs text-sm text-muted-foreground">
              No outreach sent yet — this fills in once emails start going out.
            </p>
          </div>
        ) : (
          <div className="text-(--color-blaze-orange)">
            <div className="flex gap-2">
              {/* Y axis — prospects contacted */}
              <div className="relative h-48 w-6 shrink-0">
                {yAxisTicks.map((tick, i) => (
                  <span
                    key={i}
                    className="absolute right-0 -translate-y-1/2 font-ui text-[10px] font-medium tabular-nums text-muted-foreground"
                    style={{ top: `${tick.y}%` }}
                  >
                    {tick.value}
                  </span>
                ))}
              </div>

              <div
                ref={chartRef}
                className="relative h-48 flex-1 cursor-crosshair"
                onMouseMove={handlePointerMove}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                <svg
                  className="absolute inset-0 h-full w-full overflow-visible"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  aria-hidden
                >
                  <defs>
                    <linearGradient id="contacted-area" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="currentColor" stopOpacity="0.24" />
                      <stop offset="60%" stopColor="currentColor" stopOpacity="0.06" />
                      <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* Faint gridlines aligned with the y-axis ticks */}
                  {yAxisTicks.map((tick, i) => (
                    <line
                      key={i}
                      x1="0"
                      y1={tick.y}
                      x2="100"
                      y2={tick.y}
                      stroke="currentColor"
                      strokeOpacity="0.08"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  ))}
                  {areaPath ? (
                    <path d={areaPath} fill="url(#contacted-area)" />
                  ) : null}
                  {linePath ? (
                    <path
                      d={linePath}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2.25}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}
                  {hoveredPoint ? (
                    <line
                      x1={hoveredPoint.x}
                      y1={TOP_PAD}
                      x2={hoveredPoint.x}
                      y2={TOP_PAD + usableHeight}
                      stroke="currentColor"
                      strokeOpacity="0.25"
                      strokeWidth="1"
                      strokeDasharray="2 3"
                      vectorEffect="non-scaling-stroke"
                    />
                  ) : null}
                </svg>

                {points.map((point, i) => (
                  <span
                    key={i}
                    className={cn(
                      "pointer-events-none absolute block size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-(--color-blaze-orange) shadow-sm transition-opacity",
                      hoveredIndex === i ? "opacity-100" : "opacity-0"
                    )}
                    style={{ left: `${point.x}%`, top: `${point.y}%` }}
                  />
                ))}

                {hoveredPoint ? (
                  <div
                    className="pointer-events-none absolute z-20 -translate-y-full whitespace-nowrap rounded-lg bg-foreground px-2.5 py-1.5 text-[11px] font-medium text-background shadow-md"
                    style={{
                      left: `clamp(0%, ${hoveredPoint.x}%, 100%)`,
                      top: `calc(${hoveredPoint.y}% - 10px)`,
                      transform: `translateX(${
                        hoveredPoint.x < 10 ? "0%" : hoveredPoint.x > 90 ? "-100%" : "-50%"
                      })`,
                    }}
                  >
                    <span className="font-bold tabular-nums">
                      {hoveredPoint.count}
                    </span>{" "}
                    contacted · {hoveredPoint.fullDate}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="relative mt-3.5 ml-8 h-4">
              {points.map((point, i) =>
                i % labelStep === 0 ? (
                  <span
                    key={i}
                    className="absolute -translate-x-1/2 font-ui text-[10px] font-medium uppercase tracking-wide text-muted-foreground"
                    style={{ left: `${point.x}%` }}
                  >
                    {point.label}
                  </span>
                ) : null
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
