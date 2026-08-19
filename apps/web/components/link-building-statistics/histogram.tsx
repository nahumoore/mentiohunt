import { sequentialColor } from "./chart-colors"

export function Histogram({
  data,
}: {
  data: { label: string; count: number }[]
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0)
  const maxCount = Math.max(...data.map((d) => d.count), 1)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex h-48 items-end gap-3 sm:gap-4">
        {data.map((d, index) => {
          const heightPct = Math.max((d.count / maxCount) * 100, 4)
          const share = total > 0 ? (d.count / total) * 100 : 0

          return (
            <div key={d.label} className="flex flex-1 flex-col items-center gap-2">
              <span className="text-xs font-bold tabular-nums text-foreground">
                {share.toFixed(0)}%
              </span>
              <div className="flex w-full flex-1 items-end">
                <div
                  className="w-full rounded-t-[4px] transition-[height] duration-500 ease-out"
                  style={{
                    height: `${heightPct}%`,
                    backgroundColor: sequentialColor(
                      data.length - 1 - index,
                      data.length
                    ),
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>
      <div className="mt-3 flex gap-3 sm:gap-4">
        {data.map((d) => (
          <div key={d.label} className="flex-1 text-center">
            <p className="text-[0.7rem] leading-4 text-muted-foreground">
              {d.label}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
