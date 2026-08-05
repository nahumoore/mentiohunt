import { IconRadar2 } from "@tabler/icons-react"

export function LinkTrackerEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
        <IconRadar2 className="size-5 text-(--color-blaze-orange)" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">No links tracked yet</p>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          Add a URL of a page that already links to you — we&apos;ll check it every day and flag anything that
          changes.
        </p>
      </div>
    </div>
  )
}
