"use client"

import { useCallback, useRef, useState, type ReactNode } from "react"

export interface TooltipRow {
  label: string
  value: string
}

interface TooltipState {
  x: number
  y: number
  title: string
  rows: TooltipRow[]
  swatch?: string
}

/**
 * Every chart on this page is HTML/SVG, so it gets a hover layer by default.
 * Positions are stored relative to the chart container so the tooltip tracks the
 * pointer regardless of how the SVG viewBox is scaled.
 */
export function useChartTooltip() {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  const show = useCallback(
    (
      event: { clientX: number; clientY: number },
      content: Omit<TooltipState, "x" | "y">
    ) => {
      const bounds = containerRef.current?.getBoundingClientRect()
      if (!bounds) return
      setTooltip({
        ...content,
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      })
    },
    []
  )

  const hide = useCallback(() => setTooltip(null), [])

  return { containerRef, tooltip, show, hide }
}

export function ChartTooltip({ tooltip }: { tooltip: TooltipState | null }) {
  if (!tooltip) return null

  return (
    <div
      aria-hidden
      className="pointer-events-none absolute z-20 w-max max-w-[15rem] -translate-x-1/2 -translate-y-[calc(100%+0.75rem)] rounded-xl border border-border bg-popover/98 px-3 py-2 shadow-lg backdrop-blur"
      style={{ left: tooltip.x, top: tooltip.y }}
    >
      <p className="flex items-center gap-1.5 text-xs font-semibold text-foreground">
        {tooltip.swatch ? (
          <span
            className="size-2 shrink-0 rounded-[2px]"
            style={{ backgroundColor: tooltip.swatch }}
          />
        ) : null}
        {tooltip.title}
      </p>
      <dl className="mt-1 space-y-0.5">
        {tooltip.rows.map((row) => (
          <div key={row.label} className="flex items-baseline gap-2 text-[0.7rem]">
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="ml-auto font-semibold tabular-nums text-foreground">
              {row.value}
            </dd>
          </div>
        ))}
      </dl>
    </div>
  )
}

/**
 * Wraps a chart so the tooltip has a positioning context and wide charts scroll
 * inside their own container rather than pushing the page sideways.
 *
 * The scroll region and the tooltip layer are deliberately separate elements:
 * `containerRef` sits on the outer, non-scrolling box so the tooltip (a sibling,
 * not a descendant of the `overflow-x-auto` scroller) is never clipped by it —
 * setting `overflow-x` on an ancestor also clips overflow-y, which cut the
 * tooltip off whenever it popped up above the chart, and the tooltip's own width
 * used to be able to widen the scroller and spawn a horizontal scrollbar.
 */
export function ChartCanvas({
  containerRef,
  tooltip,
  minWidth = 480,
  children,
}: {
  containerRef: React.Ref<HTMLDivElement>
  tooltip: TooltipState | null
  minWidth?: number
  children: ReactNode
}) {
  return (
    <div ref={containerRef} className="relative">
      <div className="-mx-1 overflow-x-auto px-1 pb-1">
        <div style={{ minWidth: `${minWidth}px` }}>{children}</div>
      </div>
      <ChartTooltip tooltip={tooltip} />
    </div>
  )
}
