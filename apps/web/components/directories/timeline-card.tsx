import { IconExternalLink } from "@tabler/icons-react"
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"

import { formatDate } from "@/app/dashboard/link-building/directories/_data"

function MetaRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-4 py-2.5 text-sm">
      <span className="w-40 shrink-0 text-muted-foreground">{label}</span>
      <span className="min-w-0 text-foreground">{value}</span>
    </div>
  )
}

interface TimelineCardProps {
  discoveredAt: string | null | undefined
  submittedAt: string | null | undefined
  lastIndexedAt: string | null | undefined
  lastCheckedAt: string | null | undefined
  listingUrl: string | null | undefined
}

export function TimelineCard({
  discoveredAt,
  submittedAt,
  lastIndexedAt,
  lastCheckedAt,
  listingUrl,
}: TimelineCardProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Tracking timeline</CardTitle>
      </CardHeader>
      <CardContent className="divide-y divide-border/60 px-6 py-0 pb-4">
        <MetaRow label="Discovered" value={formatDate(discoveredAt)} />
        <MetaRow label="Submitted" value={submittedAt ? formatDate(submittedAt) : "—"} />
        <MetaRow label="Last indexed" value={lastIndexedAt ? formatDate(lastIndexedAt) : "—"} />
        <MetaRow label="Last checked" value={lastCheckedAt ? formatDate(lastCheckedAt) : "—"} />
        {listingUrl && (
          <MetaRow
            label="Listing URL"
            value={
              <a
                href={listingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 break-all text-primary underline-offset-2 hover:underline"
              >
                {listingUrl}
                <IconExternalLink className="size-3 shrink-0" />
              </a>
            }
          />
        )}
      </CardContent>
    </Card>
  )
}
