"use client"

import { useEffect, type ReactNode } from "react"

import type { BacklinkNetworkMembership } from "@/stores/backlink-network-store"
import { useBacklinkNetworkStore } from "@/stores/backlink-network-store"
import type { CommunityMention } from "@/stores/community-mention-store"
import { useCommunityMentionStore } from "@/stores/community-mention-store"
import type { DiscoverySettings } from "@/stores/discovery-settings-store"
import { useDiscoverySettingsStore } from "@/stores/discovery-settings-store"
import type { DashboardProduct } from "@/stores/product-store"
import { useProductStore } from "@/stores/product-store"
import type { ProspectListItem } from "@/stores/prospect-store"
import { useProspectStore } from "@/stores/prospect-store"
import type { DashboardProfile } from "@/stores/profile-store"
import { useProfileStore } from "@/stores/profile-store"
import type { DirectorySubmissionListItem } from "@/stores/directory-submission-store"
import { useDirectorySubmissionStore } from "@/stores/directory-submission-store"

type DashboardStoreHydratorProps = {
  profile: DashboardProfile | null
  product: DashboardProduct | null
  prospects: ProspectListItem[]
  directorySubmissions: DirectorySubmissionListItem[]
  communityMentions: CommunityMention[]
  hasRunningCommunityRun: boolean
  hasReplyQueueConfig: boolean
  discoverySettings: DiscoverySettings | null
  backlinkNetworkMembership: BacklinkNetworkMembership | null
  children: ReactNode
}

export function DashboardStoreHydrator({
  profile,
  product,
  prospects,
  directorySubmissions,
  communityMentions,
  hasRunningCommunityRun,
  hasReplyQueueConfig,
  discoverySettings,
  backlinkNetworkMembership,
  children,
}: DashboardStoreHydratorProps) {
  useEffect(() => {
    useProfileStore.getState().setProfile(profile)
    useProductStore.getState().setProduct(product)
    useProspectStore.getState().setProspects(prospects)
    useDirectorySubmissionStore.getState().setSubmissions(directorySubmissions)
    useCommunityMentionStore.getState().setMentions(communityMentions)
    useCommunityMentionStore.getState().setHasRunningRun(hasRunningCommunityRun)
    useCommunityMentionStore.getState().setHasReplyQueueConfig(hasReplyQueueConfig)
    useDiscoverySettingsStore.getState().setSettings(discoverySettings)
    useBacklinkNetworkStore.getState().setMembership(backlinkNetworkMembership)
  }, [profile, product, prospects, directorySubmissions, communityMentions, hasRunningCommunityRun, hasReplyQueueConfig, discoverySettings, backlinkNetworkMembership])

  return children
}
