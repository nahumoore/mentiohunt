"use client"

import { create } from "zustand"

import type { Tables } from "@workspace/supabase/database-types"

export type NotificationListItem = Pick<
  Tables<"notifications">,
  | "id"
  | "type"
  | "title"
  | "body"
  | "link_href"
  | "prospect_id"
  | "tracked_link_id"
  | "read_at"
  | "created_at"
>

export type PlatformUpdateListItem = Pick<
  Tables<"notification_platform_updates">,
  "id" | "title" | "body" | "link_href" | "published_at"
> & {
  read_at: string | null
}

type NotificationStore = {
  notifications: NotificationListItem[]
  platformUpdates: PlatformUpdateListItem[]
  setNotifications: (notifications: NotificationListItem[]) => void
  upsertNotification: (notification: NotificationListItem) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  setPlatformUpdates: (updates: PlatformUpdateListItem[]) => void
  upsertPlatformUpdate: (update: PlatformUpdateListItem) => void
  markPlatformUpdateRead: (id: string) => void
}

export const useNotificationStore = create<NotificationStore>()((set) => ({
  notifications: [],
  platformUpdates: [],
  setNotifications: (notifications) => set({ notifications }),
  upsertNotification: (notification) =>
    set((state) => {
      const exists = state.notifications.some((item) => item.id === notification.id)
      return {
        notifications: exists
          ? state.notifications.map((item) => (item.id === notification.id ? notification : item))
          : [notification, ...state.notifications],
      }
    }),
  markNotificationRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((item) =>
        item.id === id && !item.read_at ? { ...item, read_at: new Date().toISOString() } : item
      ),
    })),
  markAllNotificationsRead: () =>
    set((state) => {
      const now = new Date().toISOString()
      return {
        notifications: state.notifications.map((item) => (item.read_at ? item : { ...item, read_at: now })),
      }
    }),
  setPlatformUpdates: (platformUpdates) => set({ platformUpdates }),
  upsertPlatformUpdate: (update) =>
    set((state) => {
      const exists = state.platformUpdates.some((item) => item.id === update.id)
      return {
        platformUpdates: exists
          ? state.platformUpdates.map((item) => (item.id === update.id ? update : item))
          : [update, ...state.platformUpdates],
      }
    }),
  markPlatformUpdateRead: (id) =>
    set((state) => {
      const now = new Date().toISOString()
      return {
        platformUpdates: state.platformUpdates.map((item) =>
          item.id === id && !item.read_at ? { ...item, read_at: now } : item
        ),
      }
    }),
}))
