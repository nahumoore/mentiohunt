"use client"

import { IconExternalLink } from "@tabler/icons-react"

type CompetitorsSectionProps = {
  competitors: string[]
}

function getHostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return url.replace(/^https?:\/\//, "").replace(/^www\./, "")
  }
}

export function CompetitorsSection({ competitors }: CompetitorsSectionProps) {
  return (
    <div className="overflow-hidden rounded-3xl border border-border/70 bg-card">
      <div className="border-b border-border/70 px-5 py-4">
        <p className="text-sm font-medium">Competitors</p>
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Sites used to find overlap, comparison pages, and
          alternative-page opportunities.
        </p>
      </div>

      {competitors.length === 0 ? (
        <div className="px-5 py-8">
          <p className="text-sm font-medium">No competitors added yet</p>
          <p className="mt-1 max-w-xl text-xs leading-5 text-muted-foreground">
            Add competitor sites during product setup so discovery can find
            overlap, comparison pages, and alternative-page opportunities.
          </p>
        </div>
      ) : (
        competitors.map((competitor) => (
          <a
            key={competitor}
            href={competitor}
            target="_blank"
            rel="noreferrer"
            className="group flex cursor-pointer items-center gap-4 border-b border-border/70 px-5 py-4 transition-colors last:border-b-0 hover:bg-muted/30 focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-inset"
          >
            <div className="flex size-9 shrink-0 items-center justify-center rounded-2xl bg-orange/10">
              {/* Favicons are loaded from Google's dynamic favicon endpoint. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${getHostname(competitor)}&sz=32`}
                className="size-5 rounded"
                alt=""
              />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium">{getHostname(competitor)}</p>
              <p className="mt-0.5 truncate text-xs leading-5 text-muted-foreground">
                {competitor}
              </p>
            </div>
            <IconExternalLink className="size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground" />
          </a>
        ))
      )}
    </div>
  )
}
