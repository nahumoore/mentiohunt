"use client"

import { useEffect, type ReactNode } from "react"

import type { DashboardProduct } from "@/stores/product-store"
import { useProductStore } from "@/stores/product-store"
import type { DashboardProfile } from "@/stores/profile-store"
import { useProfileStore } from "@/stores/profile-store"

type DashboardStoreHydratorProps = {
  profile: DashboardProfile | null
  product: DashboardProduct | null
  children: ReactNode
}

export function DashboardStoreHydrator({
  profile,
  product,
  children,
}: DashboardStoreHydratorProps) {
  useEffect(() => {
    useProfileStore.getState().setProfile(profile)
    useProductStore.getState().setProduct(product)
  }, [profile, product])

  return children
}
