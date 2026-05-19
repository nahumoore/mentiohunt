import {
  IconAlertCircle,
  IconCircleCheck,
  IconCircleX,
  IconExternalLink,
  IconMail,
  IconUser,
} from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"

import {
  ACTION_TYPE_CONFIG,
  TYPE_CONFIG,
  formatDate,
} from "@/app/dashboard/link-building/opportunities/_data"
import type { ProspectDetail } from "@/stores/prospect-store"

import { CopyButton } from "./copy-button"
import { EmailDraft } from "./email-draft"
import { Metric } from "./metric"
import { SectionLabel } from "./section-label"
import { getProspectReason } from "./utils"

export function EmailOutreachSections({
  prospect,
  hasEmailDraft,
  hasContact,
}: {
  prospect: ProspectDetail
  hasEmailDraft: boolean
  hasContact: boolean
}) {
  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
      <div className="flex flex-col gap-8">
        <section>
          <SectionLabel>Why this is in your queue</SectionLabel>
          <blockquote className="border-l-[3px] border-[var(--blaze-orange)] pl-5">
            <p className="leading-relaxed">{getProspectReason(prospect)}</p>
          </blockquote>
        </section>

        {hasEmailDraft ? (
          <section>
            <SectionLabel>Email draft</SectionLabel>
            <EmailDraft
              subject={prospect.email_subject}
              body={prospect.email_body}
            />
          </section>
        ) : (
          <section>
            <SectionLabel>Next action</SectionLabel>
            <div className="rounded-3xl border border-dashed border-orange/25 bg-orange/5 px-5 py-4">
              <p className="text-sm leading-6">
                Open the target page and complete the self-serve submission or
                review the page before preparing outreach.
              </p>
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-5">
        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Queue data</SectionLabel>
          <div className="grid gap-3">
            <Metric label="Type" value={TYPE_CONFIG[prospect.tier].label} />
            <Metric
              label="Action"
              value={ACTION_TYPE_CONFIG[prospect.action_type].label}
            />
            <Metric label="Created" value={formatDate(prospect.created_at)} />
          </div>
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Contact</SectionLabel>
          {hasContact ? (
            <div className="flex flex-col gap-3">
              <span className="inline-flex w-fit items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-medium text-amber-600">
                <IconAlertCircle className="size-3" />
                Unverified
              </span>
              <div className="flex flex-col divide-y divide-border/50 rounded-2xl bg-muted/50">
                {prospect.contact_name && (
                  <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                    <IconUser className="size-3.5 shrink-0 text-muted-foreground" />
                    <span className="font-medium">{prospect.contact_name}</span>
                  </div>
                )}
                {prospect.contact_email && (
                  <div className="flex items-center justify-between gap-2 px-3 py-2.5 text-sm">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="truncate text-xs">
                        {prospect.contact_email}
                      </span>
                    </div>
                    <CopyButton text={prospect.contact_email} />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No contact found yet. Use the target page to submit directly or
              check the site&apos;s about page before outreach.
            </p>
          )}
        </div>

        <div className="rounded-3xl bg-card p-5 shadow-sm ring-1 ring-foreground/5">
          <SectionLabel>Actions</SectionLabel>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full justify-start gap-2">
              <a
                href={prospect.target_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                <IconExternalLink className="size-4" />
                Open target
              </a>
            </Button>
            <Button variant="outline" className="w-full justify-start gap-2">
              <IconCircleCheck className="size-4" />
              Mark as contacted
            </Button>
            <Button
              variant="destructive"
              className="w-full justify-start gap-2"
            >
              <IconCircleX className="size-4" />
              Dismiss
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
