"use client"

import { create } from "zustand"

// Local types matching supabase/migrations/20260805120000_add_link_tracker.sql
// — written by hand because `pnpm supabase:types` only picks these up once
// the migration is applied to the linked project. Once regenerated, this can
// switch to `Pick<Tables<"tracked_links">, ...>` like every other store
// (stores/pages-store.ts) without changing any call sites.

export type TrackedLinkStatus =
  | "pending"
  | "live"
  | "nofollow"
  | "target_changed"
  | "removed"
  | "page_dead"
  | "check_failed"

export type TrackedLinkListItem = {
  id: string
  product_id: string
  source_url: string
  source_domain: string
  expected_target_url: string | null
  label: string | null
  origin: "manual" | "bulk_import"
  status: TrackedLinkStatus
  issue_since: string | null
  observed_href: string | null
  observed_anchor_text: string | null
  observed_rel: string[]
  observed_http_status: number | null
  last_checked_at: string | null
  next_check_at: string
  created_at: string
}

type LinkTrackerStore = {
  links: TrackedLinkListItem[]
  hydrated: boolean
  setLinks: (links: TrackedLinkListItem[]) => void
  addLinks: (links: TrackedLinkListItem[]) => void
  upsertLink: (link: TrackedLinkListItem) => void
  removeLink: (id: string) => void
}

export const useLinkTrackerStore = create<LinkTrackerStore>()((set) => ({
  links: [],
  hydrated: false,
  setLinks: (links) => set({ links, hydrated: true }),
  addLinks: (links) =>
    set((state) => {
      const existingIds = new Set(state.links.map((l) => l.id))
      const newOnes = links.filter((l) => !existingIds.has(l.id))
      return { links: [...newOnes, ...state.links] }
    }),
  upsertLink: (link) =>
    set((state) => {
      const exists = state.links.some((item) => item.id === link.id)
      return {
        links: exists ? state.links.map((item) => (item.id === link.id ? link : item)) : [link, ...state.links],
      }
    }),
  removeLink: (id) => set((state) => ({ links: state.links.filter((link) => link.id !== id) })),
}))
