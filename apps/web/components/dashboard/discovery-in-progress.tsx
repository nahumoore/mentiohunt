"use client"

import { IconLoader2 } from "@tabler/icons-react"

import { Card } from "@workspace/ui/components/card"

/**
 * Shown on the dashboard and prospect queue while the first discovery run is
 * still going. Replaces what used to be a bare spinner: a new user's very first
 * screen is prime real estate for explaining what the product is doing and what
 * their role will be.
 */
export function DiscoveryInProgress() {
  return (
    <Card className="rounded-xl border border-border px-6 py-10 shadow-sm">
      <div className="mx-auto flex max-w-xl flex-col items-center gap-3 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
          <IconLoader2 className="size-5 animate-spin text-(--color-blaze-orange)" />
        </span>
        <h2 className="text-base font-semibold text-foreground">
          Your first discovery run is underway
        </h2>
        <p className="text-sm leading-6 text-muted-foreground">
          We&apos;re analyzing your site and competitors to surface relevant
          backlink prospects. This usually takes a few minutes — you&apos;ll
          get an email as soon as the first batch is ready.
        </p>
      </div>
    </Card>
  )
}
