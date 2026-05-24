import { cn } from "@workspace/ui/lib/utils"

import { getDomainRatingColorScheme } from "@/components/link-building/utils"

export function DomainRatingCell({ value }: { value: number | null | undefined }) {
  const scheme = getDomainRatingColorScheme(value ?? null)
  return (
    <span
      className={cn(
        "text-sm font-semibold tabular-nums",
        value == null ? "text-muted-foreground" : ""
      )}
      style={value == null ? undefined : { color: scheme.accent }}
    >
      {value ?? "—"}
    </span>
  )
}
