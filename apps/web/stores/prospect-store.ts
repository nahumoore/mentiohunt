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
>

export type ProspectDetail = ProspectListItem &
  Pick<
    BacklinkProspect,
    | "email_subject"
    | "email_body"
    | "contact_name"
    | "contact_email"
    | "notes"
    | "created_at"
    | "directory_id"
  >

type ProspectStore = {
  prospects: ProspectListItem[]
  prospectDetailsById: Record<string, ProspectDetail>
  setProspects: (prospects: ProspectListItem[]) => void
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
  }
}

export const useProspectStore = create<ProspectStore>()((set) => ({
  prospects: [],
  prospectDetailsById: {},
  setProspects: (prospects) => set({ prospects }),
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
