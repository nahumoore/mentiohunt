import Link from "next/link"

import {
  IconBrandLinkedin,
  IconMail,
  IconUser,
} from "@tabler/icons-react"
import type { Json } from "@workspace/supabase/database-types"

import { CopyButton } from "./copy-button"

interface OpportunityContactCardProps {
  contactName: string | null
  contactEmail: string | null
  contactSocialLinks?: Json | null
}

function parseSocialLinks(raw: Json | null | undefined): Record<string, string> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {}
  return Object.fromEntries(
    Object.entries(raw as Record<string, Json>)
      .filter(([, v]) => typeof v === "string")
      .map(([k, v]) => [k, v as string])
  )
}

export function OpportunityContactCard({
  contactName,
  contactEmail,
  contactSocialLinks,
}: OpportunityContactCardProps) {
  const hasContact = contactName?.trim() || contactEmail?.trim()
  const socialLinks = parseSocialLinks(contactSocialLinks)
  const linkedinUrl = socialLinks["linkedin"] ?? null

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-[0.7rem] font-bold text-muted-foreground uppercase">
        Contact
      </p>
      {hasContact ? (
        <div className="mt-3 flex flex-col gap-3">
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
            {linkedinUrl && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 text-sm">
                <IconBrandLinkedin className="size-3.5 shrink-0 text-muted-foreground" />
                <Link
                  href={linkedinUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-xs text-blue-600 hover:underline"
                >
                  LinkedIn profile
                </Link>
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
