"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

import type { ProspectRunItem } from "@/lib/prospect-runs"

export type { ProspectRunItem }

type BacklinkProspect = Tables<"backlink_prospects">

export type ProspectSequence = Pick<
  Tables<"prospect_sequences">,
  "id" | "step" | "subject" | "body" | "status" | "scheduled_at" | "sent_at"
>

export type ProspectListItem = Pick<
  BacklinkProspect,
  | "id"
  | "product_id"
  | "domain"
  | "target_url"
  | "tier"
  | "status"
  | "discovered_at"
  | "contact_email"
  | "contact_name"
  | "domain_rating"
  | "site_relevance_score"
>

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
  runs: ProspectRunItem[]
  hasCompletedRun: boolean
  prospectDetailsById: Record<string, ProspectDetail>
  setProspects: (prospects: ProspectListItem[]) => void
  setRuns: (runs: ProspectRunItem[]) => void
  upsertProspects: (prospects: ProspectListItem[]) => void
  setHasCompletedRun: (hasCompletedRun: boolean) => void
  updateProspectStatuses: (
    prospectIds: string[],
    status: BacklinkProspect["status"]
  ) => void
  upsertProspectDetail: (prospect: ProspectDetail) => void
  clearProspects: () => void
}

function toListItem(prospect: ProspectDetail): ProspectListItem {
  return {
    id: prospect.id,
    product_id: prospect.product_id,
    domain: prospect.domain,
    target_url: prospect.target_url,
    tier: prospect.tier,
    status: prospect.status,
    discovered_at: prospect.discovered_at,
    contact_email: prospect.contact_email,
    contact_name: prospect.contact_name,
    domain_rating: prospect.domain_rating,
    site_relevance_score: prospect.site_relevance_score,
  }
}

export const useProspectStore = create<ProspectStore>()((set) => ({
  prospects: [],
  runs: [],
  hasCompletedRun: false,
  prospectDetailsById: {},
  setProspects: (prospects) => set({ prospects }),
  setRuns: (runs) => set({ runs }),
  upsertProspects: (incoming) =>
    set((state) => {
      if (incoming.length === 0) return state
      const byId = new Map(incoming.map((item) => [item.id, item]))
      const updated = state.prospects.map((item) => byId.get(item.id) ?? item)
      state.prospects.forEach((item) => byId.delete(item.id))
      const fresh = incoming.filter((item) => byId.has(item.id))
      return { prospects: fresh.length > 0 ? [...fresh, ...updated] : updated }
    }),
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
  clearProspects: () => set({ prospects: [], prospectDetailsById: {} }),
}))
