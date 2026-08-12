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
      const params = new URLSearchParams(searchParams.toString())
      if (next === defaultValue) {
        params.delete(key)
      } else {
        params.set(key, next)
      }
      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [searchParams, pathname, key, defaultValue]
  )

  return [value, setValue]
}
