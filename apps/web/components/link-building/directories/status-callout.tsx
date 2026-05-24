import {
  IconAlertTriangle,
  IconCircleCheck,
  IconCircleX,
  IconClock,
  IconExternalLink,
} from "@tabler/icons-react"
import type { DirectorySubmissionStatus } from "@/stores/directory-submission-store"

interface StatusCalloutProps {
  status: DirectorySubmissionStatus
  listingUrl: string | null | undefined
  daysSinceSubmit: number | null
}

export function StatusCallout({
  status,
  listingUrl,
  daysSinceSubmit,
}: StatusCalloutProps) {
  if (status === "indexed") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/8 p-4">
        <IconCircleCheck className="mt-0.5 size-5 shrink-0 text-emerald-600" />
        <div className="min-w-0">
          <p className="text-sm font-semibold text-emerald-700">
            Indexed by Google — this backlink is counting.
          </p>
          {listingUrl && (
            <a
              href={listingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-flex items-center gap-1 text-xs text-emerald-600 underline-offset-2 hover:underline"
            >
              {listingUrl}
              <IconExternalLink className="size-3" />
            </a>
          )}
        </div>
      </div>
    )
  }

  if (status === "submitted" && !listingUrl) {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-indigo-500/20 bg-indigo-500/8 p-4">
        <IconClock className="mt-0.5 size-5 shrink-0 text-indigo-600" />
        <div>
          <p className="text-sm font-semibold text-indigo-700">Waiting on Google</p>
          <p className="mt-0.5 text-sm text-indigo-600/80">
            {daysSinceSubmit !== null
              ? `Submitted ${daysSinceSubmit} day${daysSinceSubmit === 1 ? "" : "s"} ago. `
              : ""}
            Rechecked weekly — you&apos;ll see this update to Indexed once Google crawls the listing.
          </p>
        </div>
      </div>
    )
  }

  if (status === "not_indexed") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/8 p-4">
        <IconAlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
        <div>
          <p className="text-sm font-semibold text-amber-700">
            Not indexed — backlink not counting
          </p>
          <p className="mt-0.5 text-sm text-amber-600/80">
            Submitted {daysSinceSubmit ?? 30}+ days ago and Google still hasn&apos;t indexed your
            listing. Verify the submission went through and the listing is publicly visible.
          </p>
        </div>
      </div>
    )
  }

  if (status === "dismissed") {
    return (
      <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-muted/40 p-4">
        <IconCircleX className="mt-0.5 size-5 shrink-0 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          Dismissed. Use &ldquo;Restore&rdquo; to put it back in queue.
        </p>
      </div>
    )
  }

  return null
}
