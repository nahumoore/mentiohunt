"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type BacklinkProspect = Tables<"backlink_prospects">

export type ProspectSourcePage = Pick<
  Tables<"product_pages">,
  "id" | "url" | "title" | "page_type"
>

export type ProspectSequence = Pick<
  Tables<"prospect_sequences">,
  "id" | "step" | "subject" | "body" | "status" | "scheduled_at" | "sent_at"
>

export type ProspectListItem = Pick<
  BacklinkProspect,
  | "id"
  | "product_id"
  | "product_page_id"
  | "domain"
  | "target_url"
  | "tier"
  | "status"
  | "enrichment_status"
  | "discovered_at"
  | "contact_email"
  | "contact_name"
  | "domain_rating"
  | "site_relevance_score"
> & { source_page?: ProspectSourcePage | null }

export type ProspectDetail = ProspectListItem &
  Pick<
    BacklinkProspect,
    | "email_subject"
    | "email_body"
    | "created_at"
    | "found_url"
    | "contact_social_links"
    | "raw_metadata"
    | "domain_rating"
  >

type ProspectStore = {
  prospects: ProspectListItem[]
  hasCompletedRun: boolean
  prospectDetailsById: Record<string, ProspectDetail>
  setProspects: (prospects: ProspectListItem[]) => void
  setHasCompletedRun: (hasCompletedRun: boolean) => void
  updateProspectStatuses: (
    prospectIds: string[],
    status: BacklinkProspect["status"]
  ) => void
  upsertProspectDetail: (prospect: ProspectDetail) => void
  upsertProspectFromRealtime: (row: BacklinkProspect) => void
  clearProspects: () => void
}

function toListItem(prospect: ProspectDetail): ProspectListItem {
  return {
    id: prospect.id,
    product_id: prospect.product_id,
    product_page_id: prospect.product_page_id,
    domain: prospect.domain,
    target_url: prospect.target_url,
    tier: prospect.tier,
    status: prospect.status,
    enrichment_status: prospect.enrichment_status,
    discovered_at: prospect.discovered_at,
    contact_email: prospect.contact_email,
    contact_name: prospect.contact_name,
    domain_rating: prospect.domain_rating,
    site_relevance_score: prospect.site_relevance_score,
    source_page: prospect.source_page,
  }
}

export const useProspectStore = create<ProspectStore>()((set) => ({
  prospects: [],
  hasCompletedRun: false,
  prospectDetailsById: {},
  setProspects: (prospects) => set({ prospects }),
  setHasCompletedRun: (hasCompletedRun) => set({ hasCompletedRun }),
  updateProspectStatuses: (prospectIds, status) =>
    set((state) => {
      const idSet = new Set(prospectIds)
      const prospectDetailsById = { ...state.prospectDetailsById }

      prospectIds.forEach((id) => {
        const prospect = prospectDetailsById[id]
        if (prospect) {
          prospectDetailsById[id] = { ...prospect, status }
        }
      })

      return {
        prospects: state.prospects.map((prospect) =>
          idSet.has(prospect.id) ? { ...prospect, status } : prospect
        ),
        prospectDetailsById,
      }
    }),
  upsertProspectDetail: (prospect) =>
    set((state) => {
      const listItem = toListItem(prospect)
      const exists = state.prospects.some((item) => item.id === prospect.id)

      return {
        prospects: exists
          ? state.prospects.map((item) =>
              item.id === prospect.id ? listItem : item
            )
          : [listItem, ...state.prospects],
        prospectDetailsById: {
          ...state.prospectDetailsById,
          [prospect.id]: prospect,
        },
      }
    }),
  upsertProspectFromRealtime: (row) =>
    set((state) => {
      const existingDetail = state.prospectDetailsById[row.id]
      const detail: ProspectDetail = {
        id: row.id,
        product_id: row.product_id,
        product_page_id: row.product_page_id,
        domain: row.domain,
        target_url: row.target_url,
        tier: row.tier,
        status: row.status,
        enrichment_status: row.enrichment_status,
        discovered_at: row.discovered_at,
        contact_email: row.contact_email,
        contact_name: row.contact_name,
        domain_rating: row.domain_rating,
        site_relevance_score: row.site_relevance_score,
        email_subject: row.email_subject,
        email_body: row.email_body,
        created_at: row.created_at,
        found_url: row.found_url,
        contact_social_links: row.contact_social_links,
        raw_metadata: row.raw_metadata,
        source_page:
          existingDetail?.product_page_id === row.product_page_id
            ? existingDetail.source_page
            : null,
      }
      const listItem = toListItem(detail)
      const exists = state.prospects.some((item) => item.id === row.id)

      return {
        prospects: exists
          ? state.prospects.map((item) => (item.id === row.id ? listItem : item))
          : [listItem, ...state.prospects],
        prospectDetailsById: {
          ...state.prospectDetailsById,
          [row.id]: detail,
        },
      }
    }),
  clearProspects: () => set({ prospects: [], prospectDetailsById: {} }),
}))
