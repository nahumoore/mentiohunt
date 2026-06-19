"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type ProductPageRow = Tables<"product_pages">

export type ProductPageListItem = Pick<
  ProductPageRow,
  "id" | "url" | "title" | "description" | "page_type" | "priority"
>

type PagesStore = {
  pages: ProductPageListItem[]
  setPages: (pages: ProductPageListItem[]) => void
  addPage: (page: ProductPageListItem) => void
  updatePagePriority: (id: string, priority: ProductPageRow["priority"]) => void
}

export const usePagesStore = create<PagesStore>()((set) => ({
  pages: [],
  setPages: (pages) => set({ pages }),
  addPage: (page) => set((state) => ({ pages: [page, ...state.pages] })),
  updatePagePriority: (id, priority) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, priority } : p)),
    })),
}))
