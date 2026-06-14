"use client"

import { useEffect } from "react"

import { BacklinkContextCard } from "@/components/link-building/opportunities/backlink-context-card"
import { ContactInsightsCard } from "@/components/link-building/opportunities/contact-insights-card"
import { OpportunityActions } from "@/components/link-building/opportunities/opportunity-actions"
import { OpportunityContactCard } from "@/components/link-building/opportunities/opportunity-contact-card"
import { OpportunityDetailHeader } from "@/components/link-building/opportunities/opportunity-detail-header"
import { OpportunityMetaCard } from "@/components/link-building/opportunities/opportunity-meta-card"
import { OutreachDraft } from "@/components/link-building/opportunities/outreach-draft"
import { captureEvent } from "@/lib/analytics"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"

type ProspectProduct = {
  productName: string
  websiteUrl: string
}

export function ProspectClientPage({
  prospect,
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
  const current = storedProspect ?? prospect

  useEffect(() => {
    upsertProspectDetail(prospect)
    captureEvent("opportunity_viewed", {
      prospect_id: prospect.id,
      tier: prospect.tier,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prospect.id])

  return (
    <div className="flex flex-col gap-8">
      <OpportunityDetailHeader
        domain={current.domain ?? ""}
        tier={current.tier}
        status={current.status}
        discoveredAt={current.discovered_at}
        domainRating={current.domain_rating ?? null}
      />

      <div className="h-px bg-border" />

      <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* main column */}
        <div className="flex flex-col gap-6">
          {current.tier === "competitor_backlink" && (
            <BacklinkContextCard
              foundUrl={current.found_url ?? null}
              targetUrl={current.target_url ?? null}
            />
          )}

          <OutreachDraft
            subject={current.email_subject ?? ""}
            body={current.email_body ?? ""}
            prospectId={current.id}
            contactEmail={current.contact_email}
          />
        </div>

        {/* sidebar */}
        <div className="flex flex-col gap-4">
          <OpportunityContactCard
            contactName={current.contact_name}
            contactEmail={current.contact_email}
            contactSocialLinks={current.contact_social_links}
          />

          <ContactInsightsCard rawMetadata={current.raw_metadata ?? null} />

          <OpportunityMetaCard
            tier={current.tier}
            discoveredAt={current.discovered_at}
            createdAt={current.created_at}
          />
        </div>
      </div>

      <OpportunityActions
        prospectId={current.id}
        domain={current.domain}
      />
    </div>
  )
}
