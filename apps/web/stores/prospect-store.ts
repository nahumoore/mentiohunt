"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type BacklinkProspect = Tables<"backlink_prospects">

export type ProspectListItem = Pick<
  BacklinkProspect,
  | "id"
  | "product_id"
  | "domain"
  | "target_url"
  | "tier"
  | "action_type"
  | "status"
  | "discovered_at"
  | "contact_email"
  | "contact_name"
  | "notes"
>

export type ProspectDetail = ProspectListItem &
  Pick<
    BacklinkProspect,
    | "email_subject"
    | "email_body"
    | "created_at"
    | "found_url"
    | "contact_social_links"
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
  clearProspects: () => void
}

function toListItem(prospect: ProspectDetail): ProspectListItem {
  return {
    id: prospect.id,
    product_id: prospect.product_id,
    domain: prospect.domain,
    target_url: prospect.target_url,
    tier: prospect.tier,
    action_type: prospect.action_type,
    status: prospect.status,
    discovered_at: prospect.discovered_at,
    contact_email: prospect.contact_email,
    contact_name: prospect.contact_name,
    notes: prospect.notes,
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
  clearProspects: () => set({ prospects: [], prospectDetailsById: {} }),
}))
