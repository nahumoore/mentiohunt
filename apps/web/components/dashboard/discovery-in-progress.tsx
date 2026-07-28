"use client"

import {
  IconArrowRight,
  IconFiles,
  IconLayoutGrid,
  IconLoader2,
  IconSwords,
} from "@tabler/icons-react"
import Link from "next/link"
import type { ElementType } from "react"

import { AUTOPILOT_STEPS } from "@/consts/autopilot"
import { captureEvent } from "@/lib/analytics"
import { Card } from "@workspace/ui/components/card"

type WaitTask = {
  Icon: ElementType
  href: string
  label: string
  title: string
  text: string
}

/**
 * Things a waiting user can do that genuinely improve discovery quality —
 * not busywork. Competitors are AI-guessed during onboarding and target pages
 * are auto-crawled, so both are worth a human minute.
 */
const WAIT_TASKS: WaitTask[] = [
  {
    Icon: IconSwords,
    href: "/dashboard/prospects/settings",
    label: "competitors",
    title: "Check your competitors",
    text: "We guessed these from your site. Better competitors mean better prospects.",
  },
  {
    Icon: IconFiles,
    href: "/dashboard/pages",
    label: "pages",
    title: "Review your target pages",
    text: "These are the pages we'll build links to. Prioritize the ones that matter.",
  },
  {
    Icon: IconLayoutGrid,
    href: "/dashboard/directories",
    label: "directories",
    title: "Browse directories",
    text: "Submit your product while discovery runs — these links don't need outreach.",
  },
]

/**
 * Shown on the dashboard and prospect queue while the first discovery run is
 * still going. Replaces what used to be a bare spinner: a new user's very first
 * screen is prime real estate for explaining what the product is doing and what
 * their role will be.
 */
export function DiscoveryInProgress() {
  return (
    <div className="flex flex-col gap-6">
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

        <div className="mx-auto mt-8 grid w-full max-w-3xl gap-3 sm:grid-cols-3">
          {AUTOPILOT_STEPS.map(({ Icon, title, text }, i) => (
            <div
              key={title}
              className="rounded-2xl border border-border p-4 text-left"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-(--color-blaze-orange)/8 text-(--color-blaze-orange)">
                <Icon className="size-4.5" />
              </span>
              <p className="mt-3 text-sm font-semibold text-foreground">
                {i + 1}. {title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {text}
              </p>
            </div>
          ))}
        </div>
      </Card>

      <div>
        <p className="text-[0.7rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          While you wait
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Two minutes here makes every prospect we find more relevant.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          {WAIT_TASKS.map(({ Icon, href, label, title, text }) => (
            <Link
              key={href}
              href={href}
              onClick={() =>
                captureEvent("discovery_wait_task_opened", { task: label })
              }
              className="group rounded-2xl border border-border p-4 transition-colors hover:border-(--color-blaze-orange)/40 hover:bg-muted/40"
            >
              <span className="flex size-9 items-center justify-center rounded-full bg-muted text-muted-foreground">
                <Icon className="size-4.5" />
              </span>
              <p className="mt-3 flex items-center gap-1.5 text-sm font-semibold text-foreground">
                {title}
                <IconArrowRight className="size-3.5 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </p>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {text}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
