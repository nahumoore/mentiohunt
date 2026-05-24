import {
  ACTION_TYPE_CONFIG,
  SOURCE_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type MediaMentionSource,
  type ProspectActionType,
  type ProspectTier,
} from "@/app/dashboard/link-building/opportunities/_data"

interface OpportunityMetaCardProps {
  tier: ProspectTier
  actionType: ProspectActionType
  source: MediaMentionSource | null
  discoveredAt: string
  createdAt: string
}

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/40 px-3 py-2">
      <p className="text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium">{value}</p>
    </div>
  )
}

export function OpportunityMetaCard({
  tier,
  actionType,
  source,
  discoveredAt,
  createdAt,
}: OpportunityMetaCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-[0.7rem] font-bold tracking-[0.18em] text-muted-foreground uppercase">
        Queue data
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetaTile label="Type" value={TYPE_CONFIG[tier].label} />
        <MetaTile label="Action" value={ACTION_TYPE_CONFIG[actionType].label} />
        {source && (
          <MetaTile label="Source" value={SOURCE_CONFIG[source].label} />
        )}
        <MetaTile label="Discovered" value={formatDate(discoveredAt)} />
        <MetaTile label="Added" value={formatDate(createdAt)} />
      </div>
    </div>
  )
}
