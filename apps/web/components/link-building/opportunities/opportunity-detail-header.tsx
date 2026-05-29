import {
  ACTION_TYPE_CONFIG,
  TYPE_CONFIG,
  formatDate,
  type ProspectStatus,
  type ProspectTier,
  type ProspectActionType,
} from "@/app/dashboard/link-building/opportunities/_data"

import { StatusPipeline } from "./status-pipeline"

interface OpportunityDetailHeaderProps {
  domain: string
  tier: ProspectTier
  actionType: ProspectActionType
  status: ProspectStatus
  discoveredAt: string
}

export function OpportunityDetailHeader({
  domain,
  tier,
  actionType,
  status,
  discoveredAt,
}: OpportunityDetailHeaderProps) {
  const tierCfg = TYPE_CONFIG[tier]
  const actionCfg = ACTION_TYPE_CONFIG[actionType]
  const TierIcon = tierCfg.icon
  const ActionIcon = actionCfg.icon

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3">
        <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
          {domain || ACTION_TYPE_CONFIG[actionType].label}
        </h1>

        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${tierCfg.color}`}
          >
            <TierIcon className="size-3" />
            {tierCfg.label}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${actionCfg.color}`}
          >
            <ActionIcon className="size-3" />
            {actionCfg.label}
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
