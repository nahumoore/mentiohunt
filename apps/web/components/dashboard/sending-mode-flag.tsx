"use client"

import { IconBolt, IconCircleCheck, IconHelpCircle } from "@tabler/icons-react"

import { useEmailAccountStore } from "@/stores/email-account-store"
import { useProfileStore } from "@/stores/profile-store"
import { useProspectStore } from "@/stores/prospect-store"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip"

/**
 * Persistent header pill showing whether outreach is currently auto-sending
 * or held for the user's review — the same choice made in the welcome tour's
 * consent step and changeable anytime from Settings > Sending. Kept visible
 * at all times (not just explained once during onboarding) since that's
 * exactly what users said they missed.
 */
export function SendingModeFlag() {
  const profile = useProfileStore((state) => state.profile)
  const awaitingApprovalCount = useProspectStore(
    (state) => state.awaitingApprovalCount
  )
  const hasOwnOutreachMailbox = useEmailAccountStore(
    (state) => state.hasOwnOutreachMailbox
  )
  if (!profile) return null

  const manualApproval = profile.manual_approval_at != null
  const sendSource = hasOwnOutreachMailbox ? "your inbox" : "our shared sending pool"

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={
              manualApproval
                ? "inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-[11px] font-semibold text-amber-600"
                : "inline-flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1 text-[11px] font-semibold text-emerald-600"
            }
          >
            {manualApproval ? (
              <IconCircleCheck className="size-3" />
            ) : (
              <IconBolt className="size-3" />
            )}
            {manualApproval
              ? awaitingApprovalCount > 0
                ? `Review first · ${awaitingApprovalCount}`
                : "Review first"
              : "Auto-send"}
            <IconHelpCircle className="size-3 opacity-60" />
          </span>
        </TooltipTrigger>
        <TooltipContent className="flex max-w-64 flex-col items-start gap-1.5 p-3 text-left">
          <p className="text-xs leading-5">
            {manualApproval
              ? awaitingApprovalCount > 0
                ? `${awaitingApprovalCount} email${awaitingApprovalCount === 1 ? "" : "s"} waiting on your review — nothing sends until you click Send.`
                : "Outreach emails are held for your review — nothing sends until you click Send on it."
              : `Outreach emails are signed with your name and sent automatically through ${sendSource} as soon as they're ready.`}
          </p>
          <p className="text-xs leading-5 opacity-70">
            Change this in Prospects → Settings → Sending.
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
