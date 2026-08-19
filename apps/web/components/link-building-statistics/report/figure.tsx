"use client"

import { ChartBody } from "../shared/chart-body"
import { ChartDataTable, useChartExport } from "../shared/chart-frame"
import type { ChartSpec } from "../shared/chart-specs"
import { ShareBar } from "../shared/share/share-bar"

/**
 * A numbered figure, the way a paper sets one: rule, chart, numbers table.
 * Share controls sit on the rule rather than in a toolbar, so the reading
 * column stays quiet.
 */
export function ReportFigure({
  spec,
  index,
}: {
  spec: ChartSpec
  index: number
}) {
  const { ref, shareProps } = useChartExport(spec)

  return (
    <figure data-chart-id={spec.id} className="mt-7">
      <div className="flex items-center gap-3">
        <span className="shrink-0 font-heading text-[0.68rem] font-bold uppercase tracking-[0.2em] text-(--color-princeton-orange)">
          Fig. {index}
        </span>
        <span className="h-px flex-1 bg-border" />
        <ShareBar tone="ghost" {...shareProps} />
      </div>

      <div ref={ref} className="mt-6">
        <ChartBody chartId={spec.id} />
      </div>

      <ChartDataTable spec={spec} />
    </figure>
  )
}
