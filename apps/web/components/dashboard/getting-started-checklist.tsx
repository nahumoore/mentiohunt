"use client"

import {
  IconArrowRight,
  IconCircleCheckFilled,
  IconCircleDashed,
  IconX,
} from "@tabler/icons-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { captureEvent } from "@/lib/analytics"
import { useActivationStore } from "@/stores/activation-store"
import { useProspectStore } from "@/stores/prospect-store"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

/** Only the two screens a returning user actually lands on. */
const VISIBLE_PATHS = ["/dashboard", "/dashboard/prospects"]

type ChecklistItem = {
  id: string
  href: string
  title: string
  text: string
  done: boolean
}

/**
 * A short setup checklist that stays put until it's finished.
 *
 * The failure mode this addresses isn't missing information at first login —
 * it's signing up, getting pulled away, and coming back a week later with no
 * thread to pick up. A one-shot modal can't survive that; this can.
 */
export function GettingStartedChecklist() {
  const pathname = usePathname()
  const hasHydrated = useActivationStore((state) => state.hasHydrated)
  const completed = useActivationStore((state) => state.completed)
  const checklistDismissed = useActivationStore(
    (state) => state.checklistDismissed
  )
  const dismissChecklist = useActivationStore((state) => state.dismissChecklist)
  const prospectCount = useProspectStore((state) => state.prospects.length)
  const hasCompletedRun = useProspectStore((state) => state.hasCompletedRun)

  const items: ChecklistItem[] = [
    {
      id: "reviewed_competitors",
      href: "/dashboard/prospects/settings",
      title: "Check your competitors",
      text: "We guessed them from your site. Better competitors, better prospects.",
      done: completed.includes("reviewed_competitors"),
    },
    {
      id: "reviewed_pages",
      href: "/dashboard/pages",
      title: "Review your target pages",
      text: "These are the pages we'll build links to.",
      done: completed.includes("reviewed_pages"),
    },
    {
      id: "opened_prospect",
      href: "/dashboard/prospects",
      title: "Open your first prospect",
      text: "See the fit rationale and the outreach email we drafted.",
      done: completed.includes("opened_prospect"),
    },
  ]

  const doneCount = items.filter((item) => item.done).length
  const isComplete = doneCount === items.length

  // Rendered from the dashboard layout, so it has to opt out of most routes
  // itself. Waiting for hydration avoids a flash of a stale empty checklist.
  if (!hasHydrated) return null
  if (!VISIBLE_PATHS.includes(pathname)) return null
  if (checklistDismissed || isComplete) return null
  // During the first discovery run both pages render DiscoveryInProgress, which
  // already points at competitors and pages. Two nags is one too many.
  if (prospectCount === 0 && !hasCompletedRun) return null

  return (
    <div className="fixed bottom-4 left-4 right-24 z-40 sm:left-6 sm:right-auto sm:bottom-6 sm:w-[380px]">
      <Card className="rounded-xl border border-border px-5 py-4 shadow-lg">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Getting started
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Discovery and outreach already run on their own. These three
              make the results better.
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            <span className="text-xs font-medium text-muted-foreground">
              {doneCount} of {items.length}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-foreground"
              aria-label="Dismiss getting started checklist"
              onClick={dismissChecklist}
            >
              <IconX className="size-4" />
            </Button>
          </div>
        </div>

        <div className="mt-3 h-1 w-full rounded-full bg-border">
          <div
            className="h-1 rounded-full bg-(--color-blaze-orange) transition-all duration-500"
            style={{ width: `${(doneCount / items.length) * 100}%` }}
          />
        </div>

        <div className="mt-4 grid gap-2">
          {items.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              onClick={() =>
                captureEvent("activation_checklist_item_opened", {
                  item: item.id,
                })
              }
              className={cn(
                "group flex items-start gap-2.5 rounded-xl border border-border p-3 transition-colors",
                item.done
                  ? "opacity-60"
                  : "hover:border-(--color-blaze-orange)/40 hover:bg-muted/40"
              )}
            >
              {item.done ? (
                <IconCircleCheckFilled className="mt-0.5 size-4 shrink-0 text-emerald-500" />
              ) : (
                <IconCircleDashed className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
              )}
              <div className="min-w-0">
                <p
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold text-foreground",
                    item.done && "line-through"
                  )}
                >
                  {item.title}
                  {!item.done && (
                    <IconArrowRight className="size-3 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  )}
                </p>
                <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                  {item.text}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  )
}
