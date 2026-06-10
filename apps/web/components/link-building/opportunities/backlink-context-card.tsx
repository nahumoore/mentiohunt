import Link from "next/link"

import { IconArrowNarrowRight, IconExternalLink } from "@tabler/icons-react"

interface BacklinkContextCardProps {
  foundUrl: string | null
  targetUrl: string | null
}

type PanelVariant = "green" | "red"

function UrlPanel({
  label,
  url,
  variant,
}: {
  label: string
  url: string | null
  variant: PanelVariant
}) {
  let hostname = ""
  let pathname = ""

  if (url) {
    try {
      const parsed = new URL(url)
      hostname = parsed.hostname.replace(/^www\./, "")
      pathname = parsed.pathname === "/" ? "/" : parsed.pathname
    } catch {
      hostname = url
    }
  }

  const styles = {
    green: {
      wrap: "border-emerald-500/20 bg-emerald-500/5",
      label: "text-emerald-600/70",
      hostname: "text-emerald-700 dark:text-emerald-400",
      icon: "text-emerald-500/60",
    },
    red: {
      wrap: "border-red-500/20 bg-red-500/5",
      label: "text-red-600/70",
      hostname: "text-red-700 dark:text-red-400",
      icon: "text-red-500/60",
    },
  }[variant]

  return (
    <div className={`flex min-w-0 flex-1 flex-col gap-1.5 rounded-md border px-3 py-2.5 ${styles.wrap}`}>
      <p className={`text-[0.6rem] font-bold uppercase ${styles.label}`}>
        {label}
      </p>
      {url ? (
        <Link
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="group flex min-w-0 flex-col gap-0.5"
        >
          <span className={`text-sm font-medium ${styles.hostname} group-hover:underline`}>
            {hostname}
          </span>
          <span className="truncate text-[11px] text-muted-foreground">
            {pathname}
          </span>
          <span className={`mt-1 inline-flex items-center gap-0.5 text-[10px] ${styles.icon}`}>
            <IconExternalLink className="size-2.5" />
            open
          </span>
        </Link>
      ) : (
        <span className="text-xs text-muted-foreground">—</span>
      )}
    </div>
  )
}

export function BacklinkContextCard({
  foundUrl,
  targetUrl,
}: BacklinkContextCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card px-5 py-4">
      <p className="mb-3 text-[0.7rem] font-bold text-muted-foreground uppercase">
        Backlink context
      </p>
      <div className="flex items-center gap-2">
        <UrlPanel label="Their page" url={foundUrl} variant="green" />
        <IconArrowNarrowRight className="size-4 shrink-0 text-muted-foreground/40" />
        <UrlPanel label="Links to competitor" url={targetUrl} variant="red" />
      </div>
      <p className="mt-3 text-xs text-muted-foreground">
        Their page links to a competitor. The email draft pitches adding your
        product alongside it.
      </p>
    </div>
  )
}
