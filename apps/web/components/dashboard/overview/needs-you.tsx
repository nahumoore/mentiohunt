"use client"

import {
  IconArrowRight,
  IconCircleCheck,
  IconMailBolt,
  IconMailQuestion,
  IconMessageReply,
  IconClockPause,
} from "@tabler/icons-react"
import Link from "next/link"
import type { ElementType } from "react"

import { captureEvent } from "@/lib/analytics"
import { useEmailAccountStore } from "@/stores/email-account-store"
import { useOutreachActivityStore } from "@/stores/outreach-activity-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"
import { Card } from "@workspace/ui/components/card"

import type { OverviewMetrics } from "./_metrics"

type Task = {
  id: string
  Icon: ElementType
  href: string
  title: string
  text: string
  cta: string
}

/**
 * The one panel that answers "what should I do next?".
 *
 * Everything below it on the dashboard is analytics — useful later, useless to
 * a founder on day one. The autopilot counts here also make the silent
 * discovery/send window legible: without them the dashboard looks idle for
 * days while outreach is actually running.
 */
export function NeedsYou({ metrics }: { metrics: OverviewMetrics }) {
  const profile = useProfileStore((state) => state.profile)
  const poolDelayedCount = useProspectStore((state) => state.poolDelayedCount)
  const hasActiveEmailAccount = useEmailAccountStore(
    (state) => state.hasActiveEmailAccount
  )
  const sentCount = useOutreachActivityStore((state) => state.sentAt.length)

  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  const tasks: Task[] = []

  if (metrics.negotiatingCount > 0) {
    tasks.push({
      id: "replies",
      Icon: IconMessageReply,
      href: "/dashboard/prospects?stage=negotiating",
      title: `${metrics.negotiatingCount} ${metrics.negotiatingCount === 1 ? "conversation is" : "conversations are"} waiting on you`,
      text: "Someone replied, so automation stopped. Take it from here in your own mailbox.",
      cta: "Open conversations",
    })
  }

  if (metrics.emailNotFoundCount > 0) {
    tasks.push({
      id: "contacts",
      Icon: IconMailQuestion,
      href: "/dashboard/prospects?stage=email_not_found",
      title: `${metrics.emailNotFoundCount} ${metrics.emailNotFoundCount === 1 ? "prospect needs" : "prospects need"} a contact`,
      text: "We couldn't find an address for these. Add one and outreach resumes.",
      cta: "Add contacts",
    })
  }

  // Paid tiers send from their own mailbox; without one connected, outreach
  // falls back to the shared pool instead of sending as them.
  if (isPaid && hasActiveEmailAccount === false) {
    tasks.push({
      id: "mailbox",
      Icon: IconMailBolt,
      href: "/dashboard/email-accounts",
      title: "Connect your mailbox",
      text: "Outreach is sending from our shared pool until you connect your own inbox.",
      cta: "Connect mailbox",
    })
  }

  // Only free tier sends through the shared pool, so only they can be capped.
  if (profile?.tier === "free" && poolDelayedCount > 0) {
    tasks.push({
      id: "pool",
      Icon: IconClockPause,
      href: "/dashboard/billing",
      title: `${poolDelayedCount} ${poolDelayedCount === 1 ? "email is" : "emails are"} waiting on the shared pool`,
      text: "Today's shared sending limit is reached. Sending resumes automatically tomorrow.",
      cta: "Upgrade to send sooner",
    })
  }

  const stats = [
    { label: "Discovered", value: metrics.total },
    { label: "Outreach sent", value: sentCount },
    { label: "Awaiting reply", value: metrics.contactedCount },
    { label: "Replied", value: metrics.negotiatingCount },
  ]

  return (
    <Card className="rounded-xl border border-border px-5 py-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">
            Autopilot status
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Discovery and outreach run on their own. Here&apos;s where things
            stand.
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map(({ label, value }) => (
          <div key={label} className="rounded-xl border border-border p-3">
            <p className="text-2xl font-semibold text-foreground tabular-nums">
              {value}
            </p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">
              {label}
            </p>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-border pt-4">
        <p className="text-[0.7rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Needs you
        </p>

        {tasks.length === 0 ? (
          <div className="mt-3 flex items-start gap-2.5">
            <IconCircleCheck className="mt-0.5 size-4 shrink-0 text-emerald-500" />
            <p className="text-xs leading-5 text-muted-foreground">
              Nothing right now. Outreach keeps sending in the background —
              we&apos;ll email you the moment someone replies.
            </p>
          </div>
        ) : (
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {tasks.map(({ id, Icon, href, title, text, cta }) => (
              <Link
                key={id}
                href={href}
                onClick={() => captureEvent("needs_you_task_opened", { task: id })}
                className="group flex items-start gap-2.5 rounded-xl border border-border p-3 transition-colors hover:border-(--color-blaze-orange)/40 hover:bg-muted/40"
              >
                <span className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
                  <Icon className="size-4" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {title}
                  </p>
                  <p className="mt-0.5 text-[11px] leading-4 text-muted-foreground">
                    {text}
                  </p>
                  <p className="mt-1.5 flex items-center gap-1 text-[11px] font-medium text-(--color-blaze-orange)">
                    {cta}
                    <IconArrowRight className="size-3 shrink-0 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Card>
  )
}
