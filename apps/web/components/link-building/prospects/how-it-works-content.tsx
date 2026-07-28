"use client"

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconMailFast,
  IconSearch,
} from "@tabler/icons-react"
import Link from "next/link"
import type { ElementType } from "react"

import {
  STATUS_CONFIG,
  type ProspectStatus,
} from "@/app/dashboard/prospects/_data"
import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"
import {
  DialogDescription,
  DialogTitle,
} from "@workspace/ui/components/dialog"

/**
 * Condensed to two steps for the modal — discovery, then outreach through to
 * reply. Folds in the cancel-anytime message that used to live in a separate
 * "Your job" callout below, so that guidance isn't lost by the condensing.
 */
const MODAL_STEPS: { Icon: ElementType; title: string; text: string }[] = [
  {
    Icon: IconSearch,
    title: "Daily discovery",
    text: "We find and enrich matching sites for your pages every day.",
  },
  {
    Icon: IconMailFast,
    title: "Automatic outreach",
    text: "Emails and follow-ups send on their own. Cancel anything that isn't a fit — everything else keeps running until someone replies.",
  },
]

const MAIN_STATUSES = ["new", "contacted", "negotiating", "won"] as const

const MAIN_STATUS_CAPTIONS: Record<(typeof MAIN_STATUSES)[number], string> = {
  new: "Discovered, queued",
  contacted: "First email sent",
  negotiating: "They replied",
  won: "Backlink placed",
}

const EXIT_STATUSES: ProspectStatus[] = [
  "email_not_found",
  "bounced",
  "dismissed",
]

const STATUS_EXPLANATION: Record<ProspectStatus, string> = {
  new: "Just discovered — outreach is queued to send automatically.",
  contacted: "The first outreach email has gone out. No action needed.",
  negotiating: "The contact replied — check the thread and take it from here.",
  won: "You marked this as a placed backlink.",
  email_not_found: "We couldn't find a contact. Add one to resume outreach.",
  bounced: "The email bounced and the address was suppressed.",
  dismissed: "You passed on this prospect — outreach stopped.",
}

/**
 * The body of the how-it-works explainer, rendered inside a `DialogContent` by
 * both the header button (`HowItWorksDialog`) and the auto-opening first-login
 * walkthrough (`FirstLoginWalkthrough`).
 */
export function HowItWorksContent() {
  const profile = useProfileStore((state) => state.profile)
  const hasActiveEmailAccount = useEmailAccountStore(
    (state) => state.hasActiveEmailAccount
  )
  const poolDelayedCount = useProspectStore((state) => state.poolDelayedCount)
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  // Free tier (including trial) sends from the shared mailbox pool and never
  // needs a personal connection, so it's paused only when that pool hits its
  // daily cap. Paid tiers need an active personal mailbox instead.
  const poolAtCapacity = profile?.tier === "free" && poolDelayedCount > 0
  const outreachState: "live" | "mailbox_paused" | "pool_paused" =
    isPaid && hasActiveEmailAccount !== true
      ? "mailbox_paused"
      : poolAtCapacity
        ? "pool_paused"
        : "live"

  return (
    <>
      <DialogTitle>How prospects and outreach work</DialogTitle>
      <DialogDescription>
        Mentiohunt runs outreach for you — there&apos;s no separate approval
        step.
      </DialogDescription>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {MODAL_STEPS.map(({ Icon, title, text }, i) => (
          <div
            key={title}
            className="relative rounded-2xl border border-border p-4"
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

      <div
        className={
          outreachState === "live"
            ? "mt-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-1.5 text-xs font-medium text-emerald-600"
            : "mt-4 inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1.5 text-xs font-medium text-amber-600"
        }
      >
        {outreachState === "live" && (
          <>
            <IconCircleCheck className="size-3.5 shrink-0" />
            Outreach is live — emails are already going out automatically.
          </>
        )}
        {outreachState === "mailbox_paused" && (
          <>
            <IconAlertTriangle className="size-3.5 shrink-0" />
            Outreach is paused until you connect a mailbox.{" "}
            <Link
              href="/dashboard/email-accounts"
              className="underline underline-offset-2 hover:text-amber-700"
            >
              Connect now
            </Link>
          </>
        )}
        {outreachState === "pool_paused" && (
          <>
            <IconAlertTriangle className="size-3.5 shrink-0" />
            Today&apos;s shared pool limit is reached — sending resumes
            automatically tomorrow.{" "}
            <Link
              href="/dashboard/billing"
              className="underline underline-offset-2 hover:text-amber-700"
            >
              Upgrade to send sooner
            </Link>
          </>
        )}
      </div>

      <div className="mt-6 border-t border-border pt-5">
        <p className="text-[0.7rem] font-bold tracking-[0.2em] text-muted-foreground uppercase">
          Prospect statuses
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Most prospects move through these stages in order.
        </p>

        <div className="mt-4 flex items-start">
          {MAIN_STATUSES.map((status, i) => {
            const config = STATUS_CONFIG[status]
            const Icon = config.icon

            return (
              <div key={status} className="flex flex-1 items-start">
                <div className="flex flex-1 flex-col items-center gap-1.5 text-center">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon className="size-4" />
                  </span>
                  <p className="text-xs font-semibold text-foreground">
                    {config.label}
                  </p>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {MAIN_STATUS_CAPTIONS[status]}
                  </p>
                </div>
                {i < MAIN_STATUSES.length - 1 && (
                  <div className="mt-4 h-px w-4 shrink-0 border-t border-dashed border-border sm:w-8" />
                )}
              </div>
            )
          })}
        </div>

        <div className="mt-5 flex items-center gap-3">
          <span className="h-px flex-1 border-t border-dashed border-border" />
          <p className="shrink-0 text-[11px] font-medium text-muted-foreground">
            Can end here at any stage
          </p>
          <span className="h-px flex-1 border-t border-dashed border-border" />
        </div>

        <div className="mt-3 grid gap-2.5 sm:grid-cols-3">
          {EXIT_STATUSES.map((status) => {
            const config = STATUS_CONFIG[status]
            const Icon = config.icon

            return (
              <div
                key={status}
                className="flex items-start gap-2 rounded-xl border border-border p-2.5"
              >
                <span
                  className={`flex size-6 shrink-0 items-center justify-center rounded-full ${config.color}`}
                >
                  <Icon className="size-3" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground">
                    {config.label}
                  </p>
                  <p className="text-[11px] leading-4 text-muted-foreground">
                    {STATUS_EXPLANATION[status]}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <p className="mt-5 border-t border-border pt-4 text-xs leading-5 text-muted-foreground">
        Your only manual actions: dismiss a prospect you don&apos;t want, add a
        contact when one wasn&apos;t found, and reply once a conversation
        starts.
      </p>
    </>
  )
}
