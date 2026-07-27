"use client"

import { IconSearch } from "@tabler/icons-react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"

export function OutreachTemplateSearchInput({
  initialQuery,
}: {
  initialQuery: string
}) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [value, setValue] = useState(initialQuery)

  useEffect(() => {
    const timeout = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString())

      if (value.trim()) {
        params.set("q", value.trim())
      } else {
        params.delete("q")
      }

      const query = params.toString()
      router.replace(query ? `${pathname}?${query}` : pathname, {
        scroll: false,
      })
    }, 250)

    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

  return (
    <div className="relative">
      <IconSearch
        size={19}
        stroke={2}
        className="pointer-events-none absolute top-1/2 left-[22px] -translate-y-1/2 text-muted-foreground"
      />
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Search templates — broken link, guest post, follow-up…"
        className="w-full rounded-full border border-border bg-card py-[17px] pr-[22px] pl-[54px] text-[0.9375rem] text-foreground shadow-sm outline-none placeholder:text-muted-foreground focus:border-[var(--color-blaze-orange)]/40"
      />
    </div>
  )
}
