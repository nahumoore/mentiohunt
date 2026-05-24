import { IconCoins } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

export function PaidBadge({ isFree }: { isFree: boolean | null | undefined }) {
  if (isFree == null) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
        <IconCoins className="size-3" />
        Unknown
      </span>
    )
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        isFree
          ? "bg-emerald-500/10 text-emerald-600"
          : "bg-red-500/10 text-red-600"
      )}
    >
      <IconCoins className="size-3" />
      {isFree ? "Free" : "Paid"}
    </span>
  )
}
