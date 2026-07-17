"use client"

import { IconClockPause } from "@tabler/icons-react"
import Link from "next/link"

import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"

export function PoolCapacityBanner() {
  const profile = useProfileStore((state) => state.profile)
  const poolDelayedCount = useProspectStore((state) => state.poolDelayedCount)

  if (profile?.tier !== "free" || poolDelayedCount === 0) return null

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-(--color-blaze-orange)/25 bg-(--color-blaze-orange)/5 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
          <IconClockPause className="size-4 text-(--color-blaze-orange)" />
        </span>
        <div>
          <p className="text-sm font-medium text-foreground">
            Our shared email pool is at capacity for today.
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Emails go out automatically as slots open. Upgrade to get a
            dedicated sending mailbox and send sooner.
          </p>
        </div>
      </div>
      <Link
        href="/dashboard/billing"
        className="font-ui inline-flex shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange) px-4 py-2 text-xs font-semibold text-white transition-all duration-150 ease-out hover:bg-(--color-crimson-carrot) active:scale-[0.98]"
      >
        Upgrade
      </Link>
    </div>
  )
}
