import { IconInfoCircle } from "@tabler/icons-react"

import { MIN_SAMPLE_SIZE, type BucketStat, bucketReplyRate } from "@/app/link-building-statistics/_data"

import { sequentialColor } from "./chart-colors"

export function BarList({ buckets }: { buckets: BucketStat[] }) {
  const rates = buckets.map(bucketReplyRate)
  const maxRate = Math.max(...rates, 0.01)

  return (
    <ul className="flex flex-col gap-4">
      {buckets.map((bucket, index) => {
        const gated = bucket.sends < MIN_SAMPLE_SIZE
        const pct = rates[index] as number
        const width = gated ? 0 : Math.max((pct / maxRate) * 100, pct > 0 ? 4 : 0)

        return (
          <li key={bucket.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-foreground">
                {bucket.label}
              </span>
              {gated ? (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground/70">
                  <IconInfoCircle size={13} stroke={2.2} />
                  Insufficient sample (n={bucket.sends})
                </span>
              ) : (
                <span className="flex items-baseline gap-1.5 tabular-nums">
                  <span className="text-sm font-bold text-foreground">
                    {(pct * 100).toFixed(1)}%
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {bucket.replies}/{bucket.sends}
                  </span>
                </span>
              )}
            </div>
            <span className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
              {gated ? (
                <span className="block h-full w-full rounded-full bg-[repeating-linear-gradient(135deg,var(--color-muted-foreground)_0,var(--color-muted-foreground)_2px,transparent_2px,transparent_6px)] opacity-15" />
              ) : (
                <span
                  className="block h-full rounded-full transition-[width] duration-500 ease-out"
                  style={{
                    width: `${width}%`,
                    backgroundColor: sequentialColor(index, buckets.length),
                  }}
                />
              )}
            </span>
          </li>
        )
      })}
    </ul>
  )
}
