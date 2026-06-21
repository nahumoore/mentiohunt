import {
  TYPE_CONFIG,
  formatDate,
  type ProspectStatus,
  type ProspectTier,
} from "@/app/dashboard/opportunities/_data"

import { StatusPipeline } from "./status-pipeline"

interface OpportunityDetailHeaderProps {
  domain: string
  tier: ProspectTier
  status: ProspectStatus
  discoveredAt: string
  domainRating: number | null
}

function drColor(dr: number): string {
  if (dr >= 60) return "#22c55e"
  if (dr >= 30) return "#f59e0b"
  return "#f97316"
}

function DomainRatingBadge({ dr }: { dr: number }) {
  const r = 22
  const stroke = 4
  const circumference = 2 * Math.PI * r
  const fill = (dr / 100) * circumference
  const color = drColor(dr)

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div className="relative flex items-center justify-center" style={{ width: r * 2 + stroke * 2, height: r * 2 + stroke * 2 }}>
        <svg
          width={r * 2 + stroke * 2}
          height={r * 2 + stroke * 2}
          className="-rotate-90"
        >
          <circle
            cx={r + stroke}
            cy={r + stroke}
            r={r}
            fill="none"
            stroke="currentColor"
            strokeWidth={stroke}
            className="text-muted/30"
          />
          <circle
            cx={r + stroke}
            cy={r + stroke}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - fill}
          />
        </svg>
        <span className="absolute text-sm font-bold tabular-nums" style={{ color }}>
          {dr}
        </span>
      </div>
      <span className="text-[10px] font-medium uppercase text-muted-foreground">DR</span>
    </div>
  )
}

export function OpportunityDetailHeader({
  domain,
  tier,
  status,
  discoveredAt,
  domainRating,
}: OpportunityDetailHeaderProps) {
  const tierCfg = TYPE_CONFIG[tier]
  if (!tierCfg) return null
  const TierIcon = tierCfg.icon

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-4">
          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            {domain}
          </h1>
          {domainRating !== null && <DomainRatingBadge dr={domainRating} />}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tierCfg.color}`}
          >
            <TierIcon className="size-3" />
            {tierCfg.label}
          </span>
          <span className="text-xs text-muted-foreground">·</span>
          <span className="text-xs text-muted-foreground">
            Discovered {formatDate(discoveredAt)}
          </span>
        </div>

        <div className="mt-1">
          <StatusPipeline status={status} />
        </div>
      </div>
    </div>
  )
}
