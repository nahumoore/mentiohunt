import { cn } from "@workspace/ui/lib/utils"

import {
  TYPE_CONFIG,
  formatDate,
  type ProspectTier,
} from "@/app/dashboard/opportunities/_data"

interface OpportunityMetaCardProps {
  tier: ProspectTier
  discoveredAt: string
  createdAt: string
  siteRelevanceScore?: number | null
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

export function OpportunityMetaCard({
  tier,
  discoveredAt,
  createdAt,
  siteRelevanceScore,
}: OpportunityMetaCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-[0.7rem] font-bold uppercase text-muted-foreground">
        Queue data
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetaTile label="Type" value={TYPE_CONFIG[tier]?.label ?? tier} />
        <MetaTile label="Discovered" value={formatDate(discoveredAt)} />
        <MetaTile label="Added" value={formatDate(createdAt)} />
        {siteRelevanceScore != null && (
          <div className="rounded-md bg-muted/40 px-3 py-2">
            <p className="text-[10px] font-medium uppercase text-muted-foreground">
              Site fit
            </p>
            <p
              className={cn(
                "mt-0.5 text-sm font-semibold tabular-nums",
                siteRelevanceScore >= 4
                  ? "text-emerald-600"
                  : siteRelevanceScore === 3
                    ? "text-amber-600"
                    : "text-muted-foreground"
              )}
            >
              {siteRelevanceScore}/5
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
