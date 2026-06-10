import Link from "next/link"

import {
  IconExternalLink,
  IconMail,
  IconSparkles,
  IconWorldWww,
} from "@tabler/icons-react"
import type { Json } from "@workspace/supabase/database-types"

interface RawMetadata {
  bio: string | null
  emails: { value: string; type: string }[]
  contact_form_url: string | null
  visited_urls: string[]
  confidence: string
}

function parseRawMetadata(raw: Json | null | undefined): RawMetadata | null {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null
  const obj = raw as Record<string, Json>
  return {
    bio: typeof obj.bio === "string" ? obj.bio : null,
    emails: Array.isArray(obj.emails)
      ? (obj.emails as Json[]).flatMap((e) => {
          if (typeof e === "object" && e !== null && !Array.isArray(e)) {
            const entry = e as Record<string, Json>
            if (typeof entry.value === "string" && typeof entry.type === "string") {
              return [{ value: entry.value, type: entry.type }]
            }
          }
          return []
        })
      : [],
    contact_form_url:
      typeof obj.contact_form_url === "string" ? obj.contact_form_url : null,
    visited_urls: Array.isArray(obj.visited_urls)
      ? (obj.visited_urls as Json[]).filter((u) => typeof u === "string") as string[]
      : [],
    confidence: typeof obj.confidence === "string" ? obj.confidence : "",
  }
}

export function ContactInsightsCard({ rawMetadata }: { rawMetadata: Json | null }) {
  const data = parseRawMetadata(rawMetadata)
  if (!data) return null

  const hasContent =
    data.bio || data.emails.length > 0 || data.contact_form_url || data.visited_urls.length > 0

  if (!hasContent) return null

  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <div className="flex items-center gap-1.5">
        <IconSparkles className="size-3.5 text-muted-foreground" />
        <p className="text-[0.7rem] font-bold text-muted-foreground uppercase">
          Agent insights
        </p>
      </div>

      <div className="mt-3 flex flex-col gap-3">
        {data.bio && (
          <p className="text-xs leading-relaxed text-muted-foreground italic">
            {data.bio}
          </p>
        )}

        {data.emails.length > 0 && (
          <div className="flex flex-col divide-y divide-border/50 rounded-lg bg-muted/40">
            {data.emails.map((email) => (
              <div
                key={email.value}
                className="flex items-center justify-between gap-2 px-3 py-2"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <IconMail className="size-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs">{email.value}</span>
                </div>
                <span className="shrink-0 rounded-full bg-background px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground ring-1 ring-border/60">
                  {email.type}
                </span>
              </div>
            ))}
          </div>
        )}

        {data.contact_form_url && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40">
            <IconExternalLink className="size-3.5 shrink-0 text-muted-foreground" />
            <Link
              href={data.contact_form_url}
              target="_blank"
              rel="noopener noreferrer"
              className="truncate text-xs text-blue-600 hover:underline"
            >
              Contact form
            </Link>
          </div>
        )}

        {data.visited_urls.length > 0 && (
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-1.5">
              <IconWorldWww className="size-3 text-muted-foreground" />
              <p className="text-[10px] font-medium uppercase text-muted-foreground">
                Pages scraped
              </p>
            </div>
            <div className="flex flex-col gap-0.5 pl-1">
              {data.visited_urls.slice(0, 3).map((url) => (
                <Link
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="truncate text-[11px] text-muted-foreground hover:text-foreground hover:underline"
                >
                  {url.replace(/^https?:\/\//, "")}
                </Link>
              ))}
              {data.visited_urls.length > 3 && (
                <span className="text-[11px] text-muted-foreground">
                  +{data.visited_urls.length - 3} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
