import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"

import type { SubmissionDirectory } from "@/stores/directory-submission-store"
import { DrBadge, backlinksColor, formatBacklinks } from "./dr-badge"
import { SubmissionCostBadge } from "./submission-cost-badge"

interface DirectoryInfoCardProps {
  directory: SubmissionDirectory | null
}

export function DirectoryInfoCard({ directory }: DirectoryInfoCardProps) {
  const dr = directory?.domain_rating
  const backlinks = directory?.backlinks
  const referringDomains = directory?.referring_domains

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">SEO metrics</CardTitle>
      </CardHeader>
      <CardContent className="px-6 pb-6">
        <div className="grid grid-cols-2 gap-x-6 gap-y-5">
          <MetricCell label="Domain Rating">
            <DrBadge dr={dr} />
          </MetricCell>
          <MetricCell label="Submission">
            <SubmissionCostBadge isFree={directory?.is_free} />
          </MetricCell>
          <MetricCell label="Backlinks">
            {backlinks != null ? (
              <span className={cn("text-sm tabular-nums", backlinksColor(backlinks))}>
                {formatBacklinks(backlinks)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </MetricCell>
          <MetricCell label="Ref. Domains">
            {referringDomains != null ? (
              <span className={cn("text-sm tabular-nums", backlinksColor(referringDomains))}>
                {formatBacklinks(referringDomains)}
              </span>
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
          </MetricCell>
        </div>
      </CardContent>
    </Card>
  )
}

function MetricCell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[11px] font-medium uppercase text-muted-foreground">
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}
