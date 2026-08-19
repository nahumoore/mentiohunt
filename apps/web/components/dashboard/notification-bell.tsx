"use client"

import {
  IconArrowRight,
  IconBell,
  IconBellRinging,
  IconMailBolt,
  IconRadar2,
  IconSparkles,
} from "@tabler/icons-react"
import Link from "next/link"
import * as React from "react"

import { supabaseClient } from "@/lib/supabase/client"
import { markNotificationReadRemote, markPlatformUpdateReadRemote, stripMarkdown } from "@/lib/notifications"
import { useProfileStore } from "@/stores/profile-store"
import type { PlatformUpdateListItem } from "@/stores/notification-store"
import { useNotificationStore } from "@/stores/notification-store"
import { cn } from "@workspace/ui/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover"

import { PlatformUpdateModal } from "./platform-update-modal"

type FeedItem = {
  id: string
  kind: "notification" | "platform_update"
  title: string
  body: string | null
  linkHref: string | null
  readAt: string | null
  createdAt: string
  icon: React.ElementType
  iconClassName: string
}

// Mirrors STATUS_CONFIG's text-x-600 bg-x-500/10 pill convention from the
// prospects page — reply is good news (emerald), a link issue needs
// attention (amber), a platform update is informational (blue).
const NOTIFICATION_TYPE_STYLES: Record<
  string,
  { icon: React.ElementType; iconClassName: string }
> = {
  prospect_reply: {
    icon: IconMailBolt,
    iconClassName: "bg-emerald-500/10 text-emerald-600",
  },
  tracked_link_issue: {
    icon: IconRadar2,
    iconClassName: "bg-amber-500/10 text-amber-600",
  },
}
const PLATFORM_UPDATE_STYLE = {
  icon: IconSparkles,
  iconClassName: "bg-blue-500/10 text-blue-600",
}

function timeAgo(iso: string): string {
  const seconds = Math.max(
    0,
    Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  )
  if (seconds < 60) return "just now"
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  return `${days}d ago`
}

export function NotificationBell() {
  const [open, setOpen] = React.useState(false)
  const [viewingUpdate, setViewingUpdate] =
    React.useState<PlatformUpdateListItem | null>(null)
  const userId = useProfileStore((state) => state.profile?.id) ?? null
  const notifications = useNotificationStore((state) => state.notifications)
  const platformUpdates = useNotificationStore((state) => state.platformUpdates)
  const markNotificationRead = useNotificationStore(
    (state) => state.markNotificationRead
  )
  const markAllNotificationsRead = useNotificationStore(
    (state) => state.markAllNotificationsRead
  )
  const markPlatformUpdateRead = useNotificationStore(
    (state) => state.markPlatformUpdateRead
  )

  const unreadCount =
    notifications.filter((item) => !item.read_at).length +
    platformUpdates.filter((item) => !item.read_at).length

  const feed: FeedItem[] = [
    ...notifications.map((item) => {
      const style = NOTIFICATION_TYPE_STYLES[item.type] ?? {
        icon: IconBell,
        iconClassName: "bg-muted text-muted-foreground",
      }
      return {
        id: item.id,
        kind: "notification" as const,
        title: item.title,
        body: item.body,
        linkHref: item.link_href,
        readAt: item.read_at,
        createdAt: item.created_at,
        icon: style.icon,
        iconClassName: style.iconClassName,
      }
    }),
    ...platformUpdates.map((item) => ({
      id: item.id,
      kind: "platform_update" as const,
      title: item.title,
      body: item.body ? stripMarkdown(item.body) : item.body,
      linkHref: item.link_href,
      readAt: item.read_at,
      createdAt: item.published_at,
      icon: PLATFORM_UPDATE_STYLE.icon,
      iconClassName: PLATFORM_UPDATE_STYLE.iconClassName,
    })),
  ]
    .sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 30)

  function handleItemClick(item: FeedItem) {
    setOpen(false)

    if (item.kind === "platform_update") {
      const raw =
        platformUpdates.find((update) => update.id === item.id) ?? null
      setViewingUpdate(raw)
      if (raw && userId && !raw.read_at) {
        markPlatformUpdateRead(raw.id)
        markPlatformUpdateReadRemote(userId, raw.id)
      }
      return
    }

    if (item.readAt) return
    markNotificationRead(item.id)
    markNotificationReadRemote(item.id)
  }

  function handleMarkAllRead() {
    const unreadNotificationIds = notifications
      .filter((item) => !item.read_at)
      .map((item) => item.id)
    const unreadPlatformUpdateIds = platformUpdates
      .filter((item) => !item.read_at)
      .map((item) => item.id)
    if (
      unreadNotificationIds.length === 0 &&
      unreadPlatformUpdateIds.length === 0
    )
      return

    markAllNotificationsRead()
    for (const id of unreadPlatformUpdateIds) markPlatformUpdateRead(id)

    const supabase = supabaseClient()
    if (unreadNotificationIds.length > 0) {
      supabase
        .from("notifications")
        .update({ read_at: new Date().toISOString() })
        .in("id", unreadNotificationIds)
        .then(({ error }) => {
          if (error)
            console.error(
              "[NotificationBell] failed to mark all notifications read",
              error
            )
        })
    }
    if (userId && unreadPlatformUpdateIds.length > 0) {
      supabase
        .from("notification_platform_update_reads")
        .upsert(
          unreadPlatformUpdateIds.map((id) => ({
            user_id: userId,
            platform_update_id: id,
            read_at: new Date().toISOString(),
          }))
        )
        .then(({ error }) => {
          if (error)
            console.error(
              "[NotificationBell] failed to mark all platform updates read",
              error
            )
        })
    }
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label="Notifications"
            className="group/bell relative flex size-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-colors hover:bg-muted hover:text-foreground aria-expanded:bg-muted aria-expanded:text-foreground"
          >
            {unreadCount > 0 ? (
              <IconBellRinging className="size-5 transition-transform group-hover/bell:rotate-[-8deg]" />
            ) : (
              <IconBell className="size-5 transition-transform group-hover/bell:rotate-[-8deg]" />
            )}
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-(--color-blaze-orange) px-1 text-[0.6rem] font-bold text-white ring-2 ring-background">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align="end" sideOffset={10} className="w-96 overflow-hidden p-0">
          <div className="flex items-center justify-between gap-3 px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-(--color-blaze-orange)/10 text-(--color-blaze-orange)">
                <IconBell className="size-4" />
              </span>
              <div className="flex flex-col">
                <span className="font-heading text-base font-medium text-foreground">
                  Notifications
                </span>
                <span className="text-xs text-muted-foreground">
                  {unreadCount > 0
                    ? `${unreadCount} unread`
                    : "You're all caught up"}
                </span>
              </div>
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="shrink-0 rounded-full border border-border px-3 py-1.5 font-ui text-xs font-semibold text-muted-foreground transition-colors hover:border-(--color-blaze-orange)/30 hover:bg-(--color-blaze-orange)/10 hover:text-(--color-blaze-orange)"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="border-t border-border/60" />

          <div className="max-h-96 overflow-y-auto">
            {feed.length === 0 ? (
              <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
                <span className="flex size-12 items-center justify-center rounded-full bg-(--color-blaze-orange)/10">
                  <IconBell className="size-5 text-(--color-blaze-orange)" />
                </span>
                <p className="max-w-56 text-sm leading-6 text-muted-foreground">
                  Nothing here yet — we&apos;ll let you know the moment
                  something needs your attention.
                </p>
              </div>
            ) : (
              feed.map((item) => {
                const Icon = item.icon
                const isUnread = !item.readAt
                const content = (
                  <div
                    className={cn(
                      "group/row relative flex gap-3 border-b border-border/60 py-3.5 pr-4 pl-4 text-left transition-colors last:border-b-0 hover:bg-muted/40",
                      isUnread && "bg-(--color-blaze-orange)/[0.04]"
                    )}
                  >
                    {isUnread && (
                      <span className="absolute top-0 left-0 h-full w-0.5 bg-(--color-blaze-orange)" />
                    )}
                    <span
                      className={cn(
                        "mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full",
                        isUnread
                          ? item.iconClassName
                          : "bg-muted text-muted-foreground"
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className={cn(
                            "truncate text-sm text-foreground",
                            isUnread ? "font-semibold" : "font-medium"
                          )}
                        >
                          {item.title}
                        </p>
                        {isUnread && (
                          <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-(--color-blaze-orange)" />
                        )}
                      </div>
                      {item.body && (
                        <p className="mt-0.5 line-clamp-2 text-xs leading-5 text-muted-foreground">
                          {item.body}
                        </p>
                      )}
                      <p className="mt-1.5 text-[0.65rem] font-bold tracking-wide text-muted-foreground/70 uppercase">
                        {timeAgo(item.createdAt)}
                      </p>
                    </div>
                    {(item.linkHref || item.kind === "platform_update") && (
                      <IconArrowRight className="mt-1 size-4 shrink-0 self-center text-muted-foreground opacity-0 transition-all group-hover/row:translate-x-0.5 group-hover/row:opacity-100" />
                    )}
                  </div>
                )

                return item.kind === "notification" && item.linkHref ? (
                  <Link
                    key={item.id}
                    href={item.linkHref}
                    onClick={() => handleItemClick(item)}
                    className="block"
                  >
                    {content}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleItemClick(item)}
                    className="block w-full"
                  >
                    {content}
                  </button>
                )
              })
            )}
          </div>
        </PopoverContent>
      </Popover>
      <PlatformUpdateModal
        update={viewingUpdate}
        onClose={() => setViewingUpdate(null)}
      />
    </>
  )
}
