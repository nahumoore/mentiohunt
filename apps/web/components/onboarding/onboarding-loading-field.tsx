"use client"

import { IconLoader2 } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

export function OnboardingLoadingField({
  message,
  className,
}: {
  message: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 overflow-hidden rounded-md border border-border bg-[linear-gradient(110deg,var(--muted)_0%,var(--muted)_35%,color-mix(in_oklab,var(--blaze-orange)_12%,var(--muted))_50%,var(--muted)_65%,var(--muted)_100%)] bg-[length:200%_100%] px-4 animate-shimmer",
        className
      )}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-blaze-orange/10">
        <IconLoader2
          className="h-3.5 w-3.5 animate-spin text-(--color-blaze-orange)"
          strokeWidth={2}
        />
      </span>
      <span className="text-sm text-muted-foreground">
        {message}
        <span className="ml-0.5 inline-flex">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="animate-loading-dot"
              style={{ animationDelay: `${i * 0.16}s` }}
            >
              .
            </span>
          ))}
        </span>
      </span>
    </div>
  )
}
