"use client"

import { useEffect, type ReactNode } from "react"

import type { BacklinkNetworkMembership } from "@/stores/backlink-network-store"
import { useBacklinkNetworkStore } from "@/stores/backlink-network-store"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import type { OutreachSettings } from "@/stores/outreach-settings-store"
import { useOutreachSettingsStore } from "@/stores/outreach-settings-store"
import type { DashboardProduct } from "@/stores/product-store"
import { useProductStore } from "@/stores/product-store"
import type { ProspectListItem } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import type { DashboardProfile } from "@/stores/profile-store"
import { useProfileStore } from "@/stores/profile-store"
import type { DirectoryListItem } from "@/stores/directory-store"
import { useDirectoryStore } from "@/stores/directory-store"
import type { ProductPageListItem } from "@/stores/pages-store"
import { usePagesStore } from "@/stores/pages-store"
import { useEmailAccountStore } from "@/stores/email-account-store"

import { ProspectRealtimeSync } from "./prospect-realtime-sync"

type DashboardStoreHydratorProps = {
  profile: DashboardProfile | null
  product: DashboardProduct | null
  prospects: ProspectListItem[]
  hasCompletedProspectRun: boolean
  directories: DirectoryListItem[]
  discoverySettings: DiscoverySettings | null
  outreachSettings: OutreachSettings | null
  backlinkNetworkMembership: BacklinkNetworkMembership | null
  pages: ProductPageListItem[]
  hasActiveEmailAccount: boolean | null
  poolDelayedCount: number
  children: ReactNode
}

export function DashboardStoreHydrator({
  profile,
  product,
  prospects,
  hasCompletedProspectRun,
  directories,
  discoverySettings,
  outreachSettings,
  backlinkNetworkMembership,
  pages,
  hasActiveEmailAccount,
  poolDelayedCount,
  children,
}: DashboardStoreHydratorProps) {
  useEffect(() => {
    const prospectStore = useProspectStore.getState()
    const existingProductProspects = product
      ? prospectStore.prospects.filter(
          (prospect) => prospect.product_id === product.id
        )
      : []
    const prospectsById = new Map(
      prospects.map((prospect) => [prospect.id, prospect])
    )

    existingProductProspects.forEach((prospect) => {
      prospectsById.set(prospect.id, prospect)
    })

    useProfileStore.getState().setProfile(profile)
    useProductStore.getState().setProduct(product)
    prospectStore.setProspects(
      [...prospectsById.values()].sort(
        (a, b) =>
          new Date(b.discovered_at).getTime() -
          new Date(a.discovered_at).getTime()
      )
    )
    prospectStore.setHasCompletedRun(
      hasCompletedProspectRun || prospectStore.hasCompletedRun
    )
    prospectStore.setPoolDelayedCount(poolDelayedCount)
    useDirectoryStore.getState().setDirectories(directories)
    useDiscoverySettingsStore.getState().setSettings(discoverySettings)
    useOutreachSettingsStore.getState().setSettings(outreachSettings)
    useBacklinkNetworkStore.getState().setMembership(backlinkNetworkMembership)
    usePagesStore.getState().setPages(pages)
    useEmailAccountStore.getState().setHasActiveEmailAccount(hasActiveEmailAccount)
  }, [profile, product, prospects, hasCompletedProspectRun, directories, discoverySettings, outreachSettings, backlinkNetworkMembership, pages, hasActiveEmailAccount, poolDelayedCount])

  return (
    <>
      {children}
      <ProspectRealtimeSync />
    </>
  )
}
