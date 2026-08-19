"use client"

import { useState } from "react"
import { IconCheck, IconCopy, IconQuote } from "@tabler/icons-react"
import { toast } from "sonner"

import { useEdition } from "./edition-context"
import { pageUrlFor } from "./links"

/**
 * Page-level citation block. The whole point of this page is being cited, so the
 * citation is a first-class element rather than a footnote — both a plain-text
 * form for docs and an HTML form that carries the link.
 */
export function CiteBox({ compact = false }: { compact?: boolean }) {
  const { year, meta } = useEdition()
  const pageUrl = pageUrlFor(year)
  const citation = `Mentiohunt (${year}). Link Building Statistics: backlink outreach data from ${meta.totalSent.toLocaleString()} emails sent across ${meta.distinctProducts} products, ${meta.dateRangeLabel}. Retrieved from ${pageUrl}`
  const htmlCitation = `<a href="${pageUrl}">Link building statistics</a> — Mentiohunt, ${meta.dateRangeLabel}`

  const [copied, setCopied] = useState<string | null>(null)

  async function copy(key: string, value: string, message: string) {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(key)
      toast.success(message)
      window.setTimeout(
        () => setCopied((current) => (current === key ? null : current)),
        1800
      )
    } catch {
      toast.error("Your browser blocked clipboard access")
    }
  }

  return (
    <div
      className={`rounded-2xl border border-border bg-muted/30 ${compact ? "p-4" : "p-5 sm:p-6"}`}
    >
      <div className="flex items-center gap-2">
        <IconQuote size={15} className="text-muted-foreground/70" stroke={2.2} />
        <p className="text-[0.65rem] font-semibold uppercase tracking-[0.12em] text-muted-foreground/70">
          Cite this page
        </p>
      </div>
      <p className="mt-2.5 text-xs leading-6 text-muted-foreground">{citation}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => copy("text", citation, "Citation copied")}
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[0.7rem] font-semibold text-muted-foreground transition-colors hover:border-(--color-blaze-orange)/35 hover:text-(--color-princeton-orange)"
        >
          {copied === "text" ? (
            <IconCheck size={13} stroke={2.6} className="text-emerald-600" />
          ) : (
            <IconCopy size={13} stroke={2.4} />
          )}
          Plain text
        </button>
        <button
          type="button"
          onClick={() =>
            copy("html", htmlCitation, "HTML citation copied — it includes the link")
          }
          className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1.5 text-[0.7rem] font-semibold text-muted-foreground transition-colors hover:border-(--color-blaze-orange)/35 hover:text-(--color-princeton-orange)"
        >
          {copied === "html" ? (
            <IconCheck size={13} stroke={2.6} className="text-emerald-600" />
          ) : (
            <IconCopy size={13} stroke={2.4} />
          )}
          HTML with link
        </button>
      </div>
    </div>
  )
}
