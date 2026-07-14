"use client"

import {
  IconAlertTriangle,
  IconCircleCheck,
  IconHelpCircle,
  IconMailFast,
  IconSearch,
} from "@tabler/icons-react"
import Link from "next/link"

import { STATUS_CONFIG } from "@/app/dashboard/prospects/_data"
import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProfileStore } from "@/stores/profile-store"
import { Button } from "@workspace/ui/components/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog"

const STEPS = [
  {
    Icon: IconSearch,
    text: "We find and enrich matching sites for your pages every day.",
  },
  {
    Icon: IconMailFast,
    text: "We send outreach and follow-ups from your mailbox automatically — no action needed.",
  },
  {
    Icon: IconCircleCheck,
    text: "Your job: dismiss anything that isn't a fit. We'll email you when someone replies.",
  },
]

const STATUS_ORDER = [
  "new",
  "contacted",
  "negotiating",
  "won",
  "email_not_found",
  "dismissed",
] as const

const STATUS_EXPLANATION: Record<(typeof STATUS_ORDER)[number], string> = {
  new: "Just discovered — a sequence is queued to send from your mailbox automatically.",
  contacted: "The first outreach email has gone out. No action needed.",
  negotiating: "The contact replied — check the thread and take it from here.",
  won: "You marked this as a placed backlink.",
  email_not_found:
    "We couldn't find a contact. Add one manually to resume outreach.",
  dismissed: "You passed on this prospect — outreach stopped.",
}

export function HowItWorksDialog() {
  const profile = useProfileStore((state) => state.profile)
  const hasActiveEmailAccount = useEmailAccountStore(
    (state) => state.hasActiveEmailAccount
  )
  const isPaid = profile?.tier === "pro" || profile?.tier === "agency"
  // Free tier sends from the shared mailbox pool and never needs a personal
  // connection, so outreach is considered live regardless of
  // hasActiveEmailAccount. Paid tiers need an active personal mailbox.
  const outreachLive = !isPaid || hasActiveEmailAccount === true

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="default" className="mt-1 shrink-0">
          <IconHelpCircle className="size-4" />
          How it works
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogTitle>How prospects and outreach work</DialogTitle>
        <DialogDescription>
          Mentiohunt runs outreach for you — there's no separate approval
          step. Here's what happens.
        </DialogDescription>

        <ul className="mt-4 space-y-2.5">
          {STEPS.map(({ Icon, text }) => (
            <li
              key={text}
              className="flex items-start gap-2.5 text-sm text-muted-foreground"
            >
              <Icon className="mt-0.5 size-4 shrink-0 text-(--color-blaze-orange)" />
              <span>{text}</span>
            </li>
          ))}
        </ul>

        <div
          className={
            outreachLive
              ? "mt-4 flex items-center gap-2 rounded-lg bg-emerald-500/10 px-3 py-2.5 text-xs font-medium text-emerald-600"
              : "mt-4 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-xs font-medium text-amber-600"
          }
        >
          {outreachLive ? (
            <>
              <IconCircleCheck className="size-3.5 shrink-0" />
              Outreach is live — emails are already going out automatically.
            </>
          ) : (
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
        </div>

        <div className="mt-5 border-t border-border pt-4">
          <p className="mb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Prospect statuses
          </p>
          <div className="space-y-3">
            {STATUS_ORDER.map((status) => {
              const config = STATUS_CONFIG[status]
              const Icon = config.icon

              return (
                <div key={status} className="flex items-start gap-3">
                  <span
                    className={`flex size-7 shrink-0 items-center justify-center rounded-full ${config.color}`}
                  >
                    <Icon className="size-3.5" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">
                      {config.label}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {STATUS_EXPLANATION[status]}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        <p className="mt-4 border-t border-border pt-4 text-sm text-muted-foreground">
          Your only manual actions: dismiss a prospect you don't want, add a
          contact when one wasn't found, and reply once a conversation
          starts.
        </p>
      </DialogContent>
    </Dialog>
  )
}
