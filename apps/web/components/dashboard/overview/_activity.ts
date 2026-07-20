export type ActivityGranularity = "day" | "week"

export type ActivityBucket = {
  start: Date
  label: string
  count: number
}

const DAY_MS = 24 * 60 * 60 * 1000
const BUCKET_COUNT: Record<ActivityGranularity, number> = { day: 14, week: 8 }

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function startOfWeek(date: Date): Date {
  const day = startOfDay(date)
  const offset = (day.getDay() + 6) % 7 // Monday-start week
  return new Date(day.getTime() - offset * DAY_MS)
}

export function buildContactedSeries(
  sentAt: string[],
  granularity: ActivityGranularity
): ActivityBucket[] {
  const bucketCount = BUCKET_COUNT[granularity]
  const now = new Date()
  const currentBucketStart =
    granularity === "day" ? startOfDay(now) : startOfWeek(now)
  const stepMs = granularity === "day" ? DAY_MS : 7 * DAY_MS

  const buckets: ActivityBucket[] = Array.from(
    { length: bucketCount },
    (_, i) => {
      const start = new Date(
        currentBucketStart.getTime() - (bucketCount - 1 - i) * stepMs
      )
      return {
        start,
        count: 0,
        label:
          granularity === "day"
            ? start.toLocaleDateString("en-US", { weekday: "short" })
            : start.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      }
    }
  )

  const bucketByTime = new Map(buckets.map((b) => [b.start.getTime(), b]))

  sentAt.forEach((iso) => {
    const date = new Date(iso)
    const key = (
      granularity === "day" ? startOfDay(date) : startOfWeek(date)
    ).getTime()
    const bucket = bucketByTime.get(key)
    if (bucket) bucket.count += 1
  })

  return buckets
}
