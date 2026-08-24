import { cn } from "@workspace/ui/lib/utils"

// Single source of truth for domain-rating color coding — was previously
// duplicated with a different threshold set in prospect-pipeline-row.tsx.
export function drBadgeClass(dr: number | null | undefined): string {
  if (dr == null) return "text-muted-foreground bg-muted"
  if (dr >= 70) return "text-emerald-700 dark:text-brand-success bg-brand-success/10 ring-1 ring-inset ring-brand-success/20"
  if (dr >= 40) return "text-amber-700 dark:text-brand-warning bg-brand-warning/15 ring-1 ring-inset ring-brand-warning/25"
  return "text-muted-foreground bg-muted ring-1 ring-inset ring-border/60"
}

export function DrBadge({
  dr,
  className,
}: {
  dr: number | null | undefined
  className?: string
}) {
  if (dr == null) return <span className="text-sm text-muted-foreground">—</span>
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-sm font-bold tabular-nums",
        drBadgeClass(dr),
        className
      )}
    >
      DR {dr}
    </span>
  )
}

export function backlinksColor(n: number): string {
  if (n >= 100_000) return "text-emerald-700 font-semibold"
  if (n >= 10_000) return "text-orange-600 font-semibold"
  if (n >= 1_000) return "text-amber-700 font-semibold"
  return "text-muted-foreground"
}

export function formatBacklinks(n: number): string {
  return Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 }).format(n)
}
