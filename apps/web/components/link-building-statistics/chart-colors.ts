// Sequential ramp (low → high magnitude), light → dark, built from the
// brand's orange scale defined in packages/ui/src/styles/globals.css.
// Reused across every magnitude chart on the statistics page so tier/bucket
// order reads consistently.
const SEQUENTIAL_RAMP = [
  "var(--color-amber-flame)",
  "var(--color-orange)",
  "var(--color-deep-saffron)",
  "var(--color-princeton-orange)",
  "var(--color-harvest-orange)",
  "var(--color-pumpkin-spice)",
  "var(--color-blaze-orange-2)",
  "var(--color-blaze-orange)",
  "var(--color-crimson-carrot)",
]

export function sequentialColor(index: number, total: number): string {
  if (total <= 1) return SEQUENTIAL_RAMP[SEQUENTIAL_RAMP.length - 1] as string
  const step = (SEQUENTIAL_RAMP.length - 1) / (total - 1)
  const rampIndex = Math.round(index * step)
  return SEQUENTIAL_RAMP[rampIndex] as string
}

export const STATUS_COLORS = {
  success: { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  critical: { bar: "bg-rose-500", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  neutral: { bar: "bg-muted-foreground/40", text: "text-muted-foreground", dot: "bg-muted-foreground/40" },
} as const
