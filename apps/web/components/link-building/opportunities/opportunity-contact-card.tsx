import { IconAlertCircle, IconMail, IconUser } from "@tabler/icons-react"

import { CopyButton } from "./copy-button"

interface OpportunityContactCardProps {
  contactName: string | null
  contactEmail: string | null
}

export function OpportunityContactCard({
  contactName,
  contactEmail,
}: OpportunityContactCardProps) {
  const hasContact = contactName?.trim() || contactEmail?.trim()

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
        Contact
      </p>
      {hasContact ? (
        <div className="mt-3 flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
            <IconAlertCircle className="size-3" />
            Unverified
          </span>
          <div className="flex flex-col divide-y divide-border/50 rounded-lg bg-muted/40">
            {contactName && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium">{contactName}</span>
              </div>
            )}
            {contactEmail && (
              <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                <div className="flex min-w-0 items-center gap-2.5">
                  <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs">{contactEmail}</span>
                </div>
                <CopyButton text={contactEmail} />
              </div>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-2 text-sm text-muted-foreground">
          No contact found yet.
        </p>
      )}
    </div>
  )
}
