"use client"

import { ActionBadge } from "@/components/backlink-prospects/action-badge"
import { EmailOutreachSections } from "@/components/backlink-prospects/email-outreach-sections"
import { SelfServeDirectorySections } from "@/components/backlink-prospects/self-serve-directory-sections"
import { StatusPipeline } from "@/components/backlink-prospects/status-pipeline"
import { TypeBadge } from "@/components/backlink-prospects/type-badge"
import { type ProspectProduct } from "@/components/backlink-prospects/utils"
import type { ProspectDetail } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import { IconArrowLeft } from "@tabler/icons-react"
import { Button } from "@workspace/ui/components/button"
import Link from "next/link"
import { useEffect } from "react"
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
  const isSelfServe = currentProspect.action_type === "self_service"

  useEffect(() => {
    upsertProspectDetail(prospect)
  }, [prospect, upsertProspectDetail])

  return (
    <div className="flex flex-col gap-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link href="/dashboard/link-building/prospects">
            <IconArrowLeft className="size-3.5" />
            Back to prospects
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-3">
          <div>
            <h1 className="flex items-center gap-3 font-heading text-3xl font-bold tracking-tight sm:text-4xl">
              {isSelfServe && (
                <img
                  src={`https://www.google.com/s2/favicons?domain=${currentProspect.domain}&sz=32`}
                  alt=""
                  className="size-8 rounded"
                />
              )}
              {currentProspect.domain}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={currentProspect.tier} />
            <ActionBadge actionType={currentProspect.action_type} />
            <span className="text-xs text-muted-foreground">·</span>
            <span className="text-xs text-muted-foreground">
              Discovered {formatDate(currentProspect.discovered_at)}
            </span>
          </div>

          {!isSelfServe && (
            <div className="mt-1">
              <StatusPipeline status={currentProspect.status} />
            </div>
          )}
        </div>
      </div>

      <div className="h-px bg-border" />

      {isSelfServe ? (
        <SelfServeDirectorySections
          prospect={currentProspect}
          product={product}
        />
      ) : (
        <EmailOutreachSections
          prospect={currentProspect}
          hasEmailDraft={hasEmailDraft}
          hasContact={hasContact}
        />
      )}
    </div>
  )
}
