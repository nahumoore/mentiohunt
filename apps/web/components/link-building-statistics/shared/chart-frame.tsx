"use client"

import { useMemo, useRef } from "react"
import { IconTable } from "@tabler/icons-react"

import type { ChartSpec } from "./chart-specs"
import { useEdition } from "./edition-context"
import { displayUrlFor, embedPathFor, pageUrlFor } from "./links"
import type { ChartShareProps } from "./share/share-bar"

/**
 * Gives a chart everything the share actions need: a ref to find the live <svg>
 * node at click time, and the metadata that gets baked into the exported image so
 * a screenshot still credits the source. Reads the year from `useEdition()` so
 * every URL baked into the share actions points at the edition actually on screen.
 */
export function useChartExport(spec: ChartSpec) {
  const { year } = useEdition()
  const ref = useRef<HTMLDivElement>(null)

  const shareProps = useMemo<ChartShareProps>(
    () => ({
      anchorId: spec.id,
      stat: spec.stat,
      pageUrl: pageUrlFor(year),
      embedPath: embedPathFor(year, spec.id),
      meta: {
        title: spec.title,
        subtitle: spec.subtitle,
        sourceLine: spec.sourceLine,
        url: displayUrlFor(year),
        slug: spec.id,
      },
      getSvg: () => ref.current?.querySelector("svg") ?? null,
    }),
    [spec, year]
  )

  return { ref, shareProps }
}

/**
 * The table view every chart needs so the data is reachable without relying on
 * colour, hover, or eyesight.
 */
export function ChartDataTable({ spec }: { spec: ChartSpec }) {
  return (
    <details className="group mt-4">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground">
        <IconTable size={14} stroke={2.1} />
        <span className="group-open:hidden">Show the numbers</span>
        <span className="hidden group-open:inline">Hide the numbers</span>
      </summary>
      <div className="mt-3 overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[26rem] border-collapse text-left text-xs">
          <caption className="sr-only">
            {spec.title} — {spec.sourceLine}
          </caption>
          <thead>
            <tr className="bg-muted/50">
              {spec.table.columns.map((column, index) => (
                <th
                  key={column}
                  scope="col"
                  className={`px-3 py-2 font-semibold text-foreground ${index > 0 ? "text-right" : ""}`}
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {spec.table.rows.map((row) => (
              <tr key={row[0]} className="border-t border-border">
                {row.map((cell, index) => (
                  <td
                    key={`${row[0]}-${index}`}
                    className={`px-3 py-2 tabular-nums ${
                      index === 0
                        ? "font-medium text-foreground"
                        : "text-right text-muted-foreground"
                    }`}
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
