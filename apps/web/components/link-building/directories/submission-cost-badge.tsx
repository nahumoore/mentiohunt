import { IconCoins } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

type SubmissionCostBadgeProps = {
  isFree: boolean | null | undefined
  size?: "sm" | "md"
  className?: string
}

export function SubmissionCostBadge({
  isFree,
  size = "sm",
  className,
}: SubmissionCostBadgeProps) {
  const label = isFree == null ? "Unknown" : isFree ? "Free" : "Paid"
  const title =
    isFree == null
      ? "Submission price is not known yet"
      : isFree
        ? "This directory accepts free submissions"
        : "This directory requires or offers a paid listing"

  return (
    <span
      title={title}
      className={cn(
        "inline-flex shrink-0 items-center rounded-full border font-semibold shadow-sm",
        size === "md" ? "gap-1.5 px-2.5 py-1 text-xs" : "gap-1 px-2 py-0.5 text-xs",
        isFree == null
          ? "border-border bg-muted/70 text-muted-foreground"
          : isFree
            ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
            : "border-blaze-orange/25 bg-blaze-orange/10 text-(--color-blaze-orange)",
        className
      )}
    >
      <IconCoins className={cn(size === "md" ? "size-3.5" : "size-3")} />
      {label}
    </span>
  )
}
