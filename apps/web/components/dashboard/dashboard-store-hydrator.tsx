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
import type { DiscoveryStatus } from "@/hooks/use-discovery-progress"
import { useDiscoveryStatusStore } from "@/stores/discovery-status-store"

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
  initialDiscoveryStatus: DiscoveryStatus | null
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
  initialDiscoveryStatus,
  children,
}: DashboardStoreHydratorProps) {
  useEffect(() => {
    useProfileStore.getState().setProfile(profile)
    useProductStore.getState().setProduct(product)
    useProspectStore.getState().setProspects(prospects)
    useProspectStore.getState().setHasCompletedRun(hasCompletedProspectRun)
    useDirectoryStore.getState().setDirectories(directories)
    useDiscoverySettingsStore.getState().setSettings(discoverySettings)
    useOutreachSettingsStore.getState().setSettings(outreachSettings)
    useBacklinkNetworkStore.getState().setMembership(backlinkNetworkMembership)
    usePagesStore.getState().setPages(pages)
    useDiscoveryStatusStore.getState().setStatus(initialDiscoveryStatus)
  }, [profile, product, prospects, hasCompletedProspectRun, directories, discoverySettings, outreachSettings, backlinkNetworkMembership, pages, initialDiscoveryStatus])

  return children
}
