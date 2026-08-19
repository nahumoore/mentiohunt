"use client"

import { useState } from "react"
import { IconCheck, IconCopy } from "@tabler/icons-react"

const ATTRIBUTION_URL = "https://mentiohunt.com/link-building-statistics"

export function CopyStatButton({ stat }: { stat: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    const text = `${stat} — via Mentiohunt (${ATTRIBUTION_URL})`
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      // Clipboard permission denied — nothing to fall back to, fail silently.
    }
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[0.7rem] font-semibold text-muted-foreground shadow-sm transition-colors hover:border-(--color-blaze-orange)/30 hover:text-(--color-princeton-orange)"
    >
      {copied ? (
        <>
          <IconCheck size={13} stroke={2.6} className="text-emerald-600" />
          Copied
        </>
      ) : (
        <>
          <IconCopy size={13} stroke={2.4} />
          Copy stat
        </>
      )}
    </button>
  )
}
