"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

type ProductPageRow = Tables<"product_pages">

export type ProductPageListItem = Pick<
  ProductPageRow,
  | "id"
  | "url"
  | "title"
  | "description"
  | "page_type"
  | "priority"
  | "relevance_score"
  | "matched_keywords"
  | "is_target"
  | "is_manual"
>

type PagesStore = {
  pages: ProductPageListItem[]
  setPages: (pages: ProductPageListItem[]) => void
  addPage: (page: ProductPageListItem) => void
  upsertPage: (page: ProductPageListItem) => void
  removePage: (id: string) => void
  /** Sets priority = index + 1 (1 = highest) for each id in the given order; other pages untouched. */
  reorderPages: (orderedIds: string[]) => void
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
  reorderPages: (orderedIds) =>
    set((state) => {
      const priorityById = new Map(orderedIds.map((id, index) => [id, (index + 1) as ProductPageRow["priority"]]))
      return {
        pages: state.pages.map((p) =>
          priorityById.has(p.id) ? { ...p, priority: priorityById.get(p.id)! } : p
        ),
      }
    }),
}))
