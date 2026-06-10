import Link from "next/link"

import { IconArrowRight, IconCircleCheck } from "@tabler/icons-react"

export function AllReviewedEmpty() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-emerald-500/10">
        <IconCircleCheck className="size-5 text-emerald-500" />
      </span>
      <div className="flex flex-col gap-1.5">
        <p className="text-base font-semibold text-foreground">
          Good job — queue cleared
        </p>
        <p className="max-w-xs text-sm leading-6 text-muted-foreground">
          You&apos;ve worked through every opportunity. New ones will surface
          within the next few hours — check back soon.
        </p>
      </div>
      <Link
        href="/dashboard/mentions"
        className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        Did you check the community queue yet?
        <IconArrowRight className="size-3.5" />
      </Link>
    </div>
  )
}
