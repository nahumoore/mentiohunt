import { IconLock, IconRadar2, IconSparkles } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"

const BULLETS = [
  "Daily checks on every backlink you've earned",
  "Instant flag when a link is removed, nofollowed, or redirected",
  "One digest email a day — never a surprise ranking drop",
]

export function LinkTrackerPaywall() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-border/60 bg-card px-6 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
        <IconLock className="size-5 text-(--color-blaze-orange)" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">Link Tracker is a paid-plan feature</p>
        <p className="mx-auto max-w-sm text-sm leading-6 text-muted-foreground">
          You worked hard for every backlink. Paid plans watch them daily so you find out the moment one disappears —
          not months later when rankings slip.
        </p>
      </div>
      <ul className="mt-1 flex flex-col gap-2 text-left">
        {BULLETS.map((bullet) => (
          <li key={bullet} className="flex items-start gap-2 text-sm text-foreground">
            <IconSparkles className="mt-0.5 size-3.5 shrink-0 text-(--color-blaze-orange)" />
            {bullet}
          </li>
        ))}
      </ul>
      <Button asChild size="sm" className="mt-2 rounded-full bg-(--color-blaze-orange) text-white hover:bg-(--color-crimson-carrot)">
        <Link href="/dashboard/billing">
          <IconRadar2 className="size-4" />
          Upgrade to unlock
        </Link>
      </Button>
    </div>
  )
}
