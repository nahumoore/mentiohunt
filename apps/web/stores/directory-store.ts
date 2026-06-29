"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type Directory = Tables<"directories">

export type DirectoryListItem = Pick<
  Directory,
  | "id"
  | "name"
  | "domain"
  | "domain_rating"
  | "backlinks"
  | "is_free"
  | "submit_url"
  | "referring_domains"
  | "dofollow_backlinks"
  | "dofollow_referring_domains"
  | "seo_metrics_updated_at"
>

type DirectoryStore = {
  hydrated: boolean
  directories: DirectoryListItem[]
  setDirectories: (directories: DirectoryListItem[]) => void
  clearDirectories: () => void
}

export const useDirectoryStore = create<DirectoryStore>()((set) => ({
  hydrated: false,
  directories: [],
  setDirectories: (directories) => set({ hydrated: true, directories }),
  clearDirectories: () => set({ hydrated: false, directories: [] }),
}))
