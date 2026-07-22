import Link from "next/link"
import { IconMailForward, IconPlugConnected } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

export function ReplyViaMailboxNotice({
  contactEmail,
  isPublicMailbox,
}: {
  contactEmail: string | null
  isPublicMailbox: boolean
}) {
  if (isPublicMailbox) {
    return (
      <div className="rounded-xl border border-primary/20 bg-primary/5 px-5 py-4">
        <div className="flex items-start gap-3">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
            <IconPlugConnected className="size-4 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Connect your mailbox to keep talking</p>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
              We sent this outreach from Mentiohunt&apos;s shared mailbox — a disposable inbox we use only to reach
              out and track opens, never meant for real conversations. Connect your own inbox and take it from
              here, person to person.
            </p>
            <Button asChild size="sm" className="mt-3">
              <Link href="/dashboard/email-accounts">Connect your mailbox</Link>
            </Button>
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
