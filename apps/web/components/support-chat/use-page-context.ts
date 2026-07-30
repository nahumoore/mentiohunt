"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

import { getDeviceSnapshot, getEntrySnapshot } from "@/lib/support-chat/client-context"

const THROTTLE_MS = 10_000

/**
 * Pings the server with the current route on navigation, throttled to at
 * most once per 10s, so the console shows what page a visitor is on right
 * now. No-ops server-side until a conversation exists.
 */
export function usePageContext() {
  const pathname = usePathname()
  const lastSentAtRef = useRef(0)
  const lastPathRef = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || pathname === lastPathRef.current) return
    lastPathRef.current = pathname

    const send = () => {
      lastSentAtRef.current = Date.now()
      const entry = getEntrySnapshot()
      const device = getDeviceSnapshot()
      fetch("/api/support-chat/context", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          title: document.title,
          entryUrl: entry?.entryUrl,
          referrer: entry?.referrer,
          utm: entry?.utm,
          ...device,
        }),
      }).catch(() => {
        // Non-critical — the next navigation will retry.
      })
    }

    const elapsed = Date.now() - lastSentAtRef.current
    if (elapsed >= THROTTLE_MS) {
      send()
      return
    }

    const timeout = setTimeout(send, THROTTLE_MS - elapsed)
    return () => clearTimeout(timeout)
  }, [pathname])
}
