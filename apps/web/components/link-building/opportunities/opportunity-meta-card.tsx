import {
  ACTION_TYPE_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type ProspectActionType,
  type ProspectTier,
} from "@/app/dashboard/outreach/_data"

interface OpportunityMetaCardProps {
  tier: ProspectTier
  actionType: ProspectActionType
  discoveredAt: string
  createdAt: string
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
  actionType,
  discoveredAt,
  createdAt,
}: OpportunityMetaCardProps) {
  return (
    <div className="rounded-lg border border-border/60 bg-card p-4">
      <p className="text-[0.7rem] font-bold text-muted-foreground uppercase">
        Queue data
      </p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <MetaTile label="Type" value={TYPE_CONFIG[tier].label} />
        <MetaTile label="Action" value={ACTION_TYPE_CONFIG[actionType].label} />
        <MetaTile label="Discovered" value={formatDate(discoveredAt)} />
        <MetaTile label="Added" value={formatDate(createdAt)} />
      </div>
    </div>
  )
}
