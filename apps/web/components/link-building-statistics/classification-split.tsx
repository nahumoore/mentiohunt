import { STATUS_COLORS } from "./chart-colors"

export function ClassificationSplit({
  data,
}: {
  data: { label: string; count: number; tone: keyof typeof STATUS_COLORS }[]
}) {
  const total = data.reduce((sum, d) => sum + d.count, 0)

  return (
    <div className="rounded-2xl border border-border bg-card p-6 sm:p-7">
      <div className="flex h-4 w-full gap-0.5 overflow-hidden rounded-full bg-muted">
        {data.map((d) => {
          const share = total > 0 ? (d.count / total) * 100 : 0
          return (
            <div
              key={d.label}
              className={`${STATUS_COLORS[d.tone].bar} h-full first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${share}%` }}
            />
          )
        })}
      </div>

      <ul className="mt-6 grid gap-4 sm:grid-cols-3">
        {data.map((d) => {
          const share = total > 0 ? (d.count / total) * 100 : 0
          return (
            <li key={d.label} className="flex items-start gap-2.5">
              <span
                className={`mt-1 size-2.5 shrink-0 rounded-full ${STATUS_COLORS[d.tone].dot}`}
              />
              <div>
                <p className="text-sm font-medium text-foreground">{d.label}</p>
                <p className="text-xs text-muted-foreground">
                  <span className={`font-bold ${STATUS_COLORS[d.tone].text}`}>
                    {share.toFixed(0)}%
                  </span>{" "}
                  · {d.count} replies
                </p>
              </div>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
