"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

export type DashboardProduct = Tables<"products">

type ProductStore = {
  product: DashboardProduct | null
  setProduct: (product: DashboardProduct | null) => void
  clearProduct: () => void
}

export const useProductStore = create<ProductStore>()((set) => ({
  product: null,
  setProduct: (product) => set({ product }),
  clearProduct: () => set({ product: null }),
}))

export function getProductDisplayName(product: DashboardProduct | null) {
  if (!product?.website_url) {
    return "Your product"
  }

  try {
    const host = new URL(product.website_url).hostname.replace(/^www\./, "")
    const [name] = host.split(".")

    return formatProductName(name || host)
  } catch {
    return formatProductName(product.website_url)
  }
}

function formatProductName(value: string) {
  return value
    .replace(/[-_]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ")
}
