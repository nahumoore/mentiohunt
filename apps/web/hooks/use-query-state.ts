"use client"

import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback } from "react"

/**
 * Syncs a single piece of UI state (filter, sort, tab, page…) with a URL
 * search param via `router.replace` — no history entry per change, so the
 * back button isn't spammed on every keystroke/filter click.
 *
 * Reading always comes straight from the URL (no local useState mirror), so
 * two-way sync can't drift: the URL is the single source of truth.
 */

// Callers often fire several setValue() calls synchronously (e.g. sort key +
// dir + page reset). Each hook instance reads its own stale `searchParams`
// snapshot, so independent router.replace() calls would clobber each other —
// only the last one would stick. Batch same-tick updates per pathname into
// one merged replace instead.
const pendingUpdates = new Map<
  string,
  { params: URLSearchParams; scheduled: boolean }
>()

export function useQueryState<T extends string>(
  key: string,
  defaultValue: T,
  isValid: (value: string) => value is T
): [T, (value: T) => void] {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const raw = searchParams.get(key)
  const value = raw !== null && isValid(raw) ? raw : defaultValue

  const setValue = useCallback(
    (next: T) => {
      let entry = pendingUpdates.get(pathname)
      if (!entry) {
        entry = {
          params: new URLSearchParams(searchParams.toString()),
          scheduled: false,
        }
        pendingUpdates.set(pathname, entry)
      }

      if (next === defaultValue) {
        entry.params.delete(key)
      } else {
        entry.params.set(key, next)
      }

      if (!entry.scheduled) {
        entry.scheduled = true
        queueMicrotask(() => {
          pendingUpdates.delete(pathname)
          const query = entry!.params.toString()
          router.replace(query ? `${pathname}?${query}` : pathname, {
            scroll: false,
          })
        })
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, key, defaultValue]
  )

  return [value, setValue]
}
