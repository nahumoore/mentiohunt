"use client"

import { ActionBadge } from "@/components/backlink-opportunities/action-badge"
import { EmailOutreachSections } from "@/components/backlink-opportunities/email-outreach-sections"
import { StatusPipeline } from "@/components/backlink-opportunities/status-pipeline"
import { TypeBadge } from "@/components/backlink-opportunities/type-badge"
import { type ProspectProduct } from "@/components/backlink-opportunities/utils"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import { useEffect } from "react"

import { captureEvent } from "@/lib/analytics"
import { formatDate } from "../_data"

export function ProspectClientPage({
  prospect,
  product,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
}) {
  const upsertProspectDetail = useProspectStore(
    (state) => state.upsertProspectDetail
  )
  const storedProspect = useProspectStore(
    (state) => state.prospectDetailsById[prospect.id]
  )
  const currentProspect = storedProspect ?? prospect
  const hasEmailDraft =
    currentProspect.email_subject.trim().length > 0 &&
    currentProspect.email_body.trim().length > 0
  const hasContact = Boolean(
    currentProspect.contact_name?.trim() ||
    currentProspect.contact_email?.trim()
  )

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", {
      prospect_id: prospect.id,
      tier: prospect.tier,
      action_type: prospect.action_type,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/link-building/opportunities">
            <IconArrowLeft className="size-3.5" />
            Back to opportunities
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {currentProspect.domain}
          </h1>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={currentProspect.tier} />
            <ActionBadge actionType={currentProspect.action_type} />
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Discovered {formatDate(currentProspect.discovered_at)}
            </span>
          </div>

          <div className="mt-1">
            <StatusPipeline status={currentProspect.status} />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <EmailOutreachSections
        prospect={currentProspect}
        hasEmailDraft={hasEmailDraft}
        hasContact={hasContact}
      />
    </div>
  )
}
