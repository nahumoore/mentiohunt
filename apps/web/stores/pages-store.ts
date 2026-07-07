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
  upsertPage: (page: ProductPageListItem) => void
  removePage: (id: string) => void
  updatePagePriority: (id: string, priority: ProductPageRow["priority"]) => void
}

export const usePagesStore = create<PagesStore>()((set) => ({
  pages: [],
  setPages: (pages) => set({ pages }),
  addPage: (page) => set((state) => ({ pages: [page, ...state.pages] })),
  upsertPage: (page) =>
    set((state) => {
      const exists = state.pages.some((item) => item.id === page.id)

      return {
        pages: exists
          ? state.pages.map((item) => (item.id === page.id ? page : item))
          : [page, ...state.pages],
      }
    }),
  removePage: (id) =>
    set((state) => ({ pages: state.pages.filter((page) => page.id !== id) })),
  updatePagePriority: (id, priority) =>
    set((state) => ({
      pages: state.pages.map((p) => (p.id === id ? { ...p, priority } : p)),
    })),
}))
