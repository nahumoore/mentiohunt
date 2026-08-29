"use client"

import { useTransition } from "react"
import { toast } from "sonner"

import { disableManualApproval, enableManualApproval } from "@/actions/account-actions"
import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProfileStore } from "@/stores/profile-store"
import { Switch } from "@workspace/ui/components/switch"

/**
 * Lets a user switch between auto-send (default) and manual approval, where
 * discovery and drafting keep running exactly as before but nothing sends
 * until they click Send on it themselves. Takes effect immediately — unlike
 * the sibling tabs on this page, there's no draft/Save step, matching the
 * account-tab.tsx pattern for outreach pause/resume.
 */
export function SendingModeSection() {
  const [isToggling, startTransition] = useTransition()
  const profile = useProfileStore((state) => state.profile)
  const setProfile = useProfileStore((state) => state.setProfile)
  const hasOwnOutreachMailbox = useEmailAccountStore(
    (state) => state.hasOwnOutreachMailbox
  )

  const manualApproval = profile?.manual_approval_at != null
  const sendSource = hasOwnOutreachMailbox
    ? "your inbox"
    : "our shared sending pool"

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      if (checked) {
        const result = await enableManualApproval()
        if (result.error) {
          toast.error(result.error)
          return
        }

        if (profile) {
          setProfile({
            ...profile,
            manual_approval_at: result.manual_approval_at ?? new Date().toISOString(),
          })
        }

        toast.success(
          result.heldCount
            ? `Switched to manual approval — ${result.heldCount} queued email${result.heldCount === 1 ? "" : "s"} now waiting on your review.`
            : "Switched to manual approval — new drafts will wait for your review."
        )
        return
      }

      const result = await disableManualApproval()
      if (result.error) {
        toast.error(result.error)
        return
      }

      if (profile) setProfile({ ...profile, manual_approval_at: null })

      toast.success(
        result.resumedCount
          ? `Switched back to auto-send — ${result.resumedCount} held email${result.resumedCount === 1 ? "" : "s"} rescheduled.`
          : "Switched back to auto-send."
      )
    })
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.08)]">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Sending</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Controls whether outreach emails leave your inbox on their own, or
          wait for you to send them.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4 px-5 py-5">
        <div>
          <p className="text-sm font-medium">Review each email before it sends</p>
          <p className="mt-0.5 text-xs leading-5 text-muted-foreground">
            {manualApproval
              ? "On. Discovery and drafting keep running, but every email is signed with your name and waits in your prospect list for you to send it."
              : `Off. Emails are signed with your name and sent automatically through ${sendSource} as soon as they're drafted and scheduled.`}
          </p>
        </div>
        <Switch
          checked={manualApproval}
          onCheckedChange={handleToggle}
          disabled={isToggling || !profile}
          className="shrink-0"
        />
      </div>
    </div>
  )
}
