"use client"

import { useEffect } from "react"

import { DeadlinePill } from "@/components/link-building/opportunities/deadline-pill"
import { MediaMentionPanel } from "@/components/link-building/opportunities/media-mention-panel"
import { OpportunityActions } from "@/components/link-building/opportunities/opportunity-actions"
import { OpportunityContactCard } from "@/components/link-building/opportunities/opportunity-contact-card"
import { OpportunityDetailHeader } from "@/components/link-building/opportunities/opportunity-detail-header"
import { OpportunityMetaCard } from "@/components/link-building/opportunities/opportunity-meta-card"
import { OutreachDraft } from "@/components/link-building/opportunities/outreach-draft"
import { captureEvent } from "@/lib/analytics"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"

import type { MediaMention } from "../_data"
import { getDeadlineInfo } from "../_data"

type ProspectProduct = {
  productName: string
  websiteUrl: string
}

export function ProspectClientPage({
  prospect,
  mediaMention,
}: {
  prospect: ProspectDetail
  product: ProspectProduct
  mediaMention: MediaMention | null
}) {
  const upsertProspectDetail = useProspectStore(
    (state) => state.upsertProspectDetail
  )
  const storedProspect = useProspectStore(
    (state) => state.prospectDetailsById[prospect.id]
  )
  const current = storedProspect ?? prospect

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", {
      prospect_id: prospect.id,
      tier: prospect.tier,
      action_type: prospect.action_type,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  const deadlineInfo = getDeadlineInfo(mediaMention?.deadline ?? null)

  return (
    <div className="flex flex-col gap-8">
      <OpportunityDetailHeader
        domain={current.domain}
        tier={current.tier}
        actionType={current.action_type}
        status={current.status}
        discoveredAt={current.discovered_at}
        mediaMention={mediaMention}
      />

      <div className="h-px bg-border" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* main column */}
        <div className="flex flex-col gap-6">
          <MediaMentionPanel mediaMention={mediaMention} />

          <OutreachDraft
            subject={current.email_subject}
            body={current.email_body}
            prospectId={current.id}
            contactEmail={current.contact_email}
          />
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-4">
          {deadlineInfo && (
            <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card px-4 py-3">
              <span className="text-sm font-medium">Deadline</span>
              <DeadlinePill deadline={mediaMention?.deadline ?? null} />
            </div>
          )}

          <OpportunityContactCard
            contactName={current.contact_name}
            contactEmail={current.contact_email}
          />

          <OpportunityMetaCard
            tier={current.tier}
            actionType={current.action_type}
            source={mediaMention?.source ?? null}
            discoveredAt={current.discovered_at}
            createdAt={current.created_at}
          />
        </div>
      </div>

      <OpportunityActions
        prospectId={current.id}
        targetUrl={current.target_url}
        originalUrl={mediaMention?.url}
      />
    </div>
  )
}
