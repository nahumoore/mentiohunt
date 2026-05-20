import { cn } from "@workspace/ui/lib/utils"

function drStyle(dr: number): string {
  if (dr >= 70) return "text-emerald-700 bg-emerald-500/10 ring-1 ring-inset ring-emerald-600/20"
  if (dr >= 50) return "text-orange-600 bg-orange-500/10 ring-1 ring-inset ring-orange-500/20"
  if (dr >= 30) return "text-amber-700 bg-amber-500/10 ring-1 ring-inset ring-amber-500/20"
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
        drStyle(dr),
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
