import Link from "next/link"
import { IconArrowUpRight, IconLock, IconMailForward } from "@tabler/icons-react"

export function ReplyViaMailboxNotice({
  contactEmail,
  isPublicMailbox,
}: {
  contactEmail: string | null
  isPublicMailbox: boolean
}) {
  if (isPublicMailbox) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3">
        <div className="flex items-start gap-2.5">
          <IconLock className="mt-0.5 size-3.5 shrink-0 text-primary" />
          <div className="min-w-0">
            <p className="text-xs leading-relaxed text-muted-foreground">
              This outreach went out from Mentiohunt&apos;s shared mailbox, so you don&apos;t have an inbox to
              reply from directly. Connect your own mailbox to take over this conversation personally.
            </p>
            <Link
              href="/dashboard/email-accounts"
              className="mt-1.5 inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              Connect your mailbox
              <IconArrowUpRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="rounded-xl border border-border bg-muted/20 px-4 py-3">
      <div className="flex items-start gap-2.5">
        <IconMailForward className="mt-0.5 size-3.5 shrink-0 text-muted-foreground/60" />
        <p className="text-xs leading-relaxed text-muted-foreground">
          Reply from your connected mailbox
          {contactEmail && (
            <>
              {" "}
              to <span className="font-medium text-foreground">{contactEmail}</span>
            </>
          )}
          , not from Mentiohunt. Replying from your own inbox keeps this thread intact so future messages stay matched here.
        </p>
      </div>
    </div>
  )
}
