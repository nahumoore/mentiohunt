import { cn } from "@workspace/ui/lib/utils"

import type {
  CommunityMention,
  MentionIntent,
} from "@/app/dashboard/community-mentions/reply-queue/_data"
import { INTENT_CONFIG } from "@/app/dashboard/community-mentions/reply-queue/_data"
import { PLATFORM_CONFIG, type MentionPlatform } from "@/consts/platform-config"

interface MentionSidebarProps {
  mentions: CommunityMention[]
  selectedPlatform: MentionPlatform | null
  onSelectPlatform: (platform: MentionPlatform | null) => void
}

export function MentionSidebar({ mentions, selectedPlatform, onSelectPlatform }: MentionSidebarProps) {
  const total = mentions.length
  const pendingCount = mentions.filter((m) => m.status === "new").length

  const platformCounts = mentions.reduce<Record<MentionPlatform, number>>(
    (acc, m) => {
      acc[m.platform] = (acc[m.platform] ?? 0) + 1
      return acc
    },
    {} as Record<MentionPlatform, number>
  )

  const intentCounts = mentions.reduce<Record<MentionIntent, number>>(
    (acc, m) => {
      acc[m.intent] = (acc[m.intent] ?? 0) + 1
      return acc
    },
    {} as Record<MentionIntent, number>
  )

  const platforms = (Object.keys(PLATFORM_CONFIG) as MentionPlatform[])
    .map((key) => ({
      key,
      cfg: PLATFORM_CONFIG[key],
      count: platformCounts[key] ?? 0,
    }))
    .sort((a, b) => b.count - a.count)

  const intents = (Object.keys(INTENT_CONFIG) as MentionIntent[])
    .map((key) => ({
      key,
      label: INTENT_CONFIG[key].label,
      count: intentCounts[key] ?? 0,
    }))
    .filter((i) => i.count > 0)
    .sort((a, b) => b.count - a.count)

  return (
    <aside className="sticky top-6 h-fit space-y-6 lg:col-span-4">
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h5 className="mb-4 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          Pending
        </h5>
        <div className="flex items-end gap-3">
          <span className="text-4xl leading-none font-black text-foreground">
            {pendingCount}
          </span>
          <p className="mb-0.5 text-sm font-medium text-muted-foreground">
            mention{pendingCount !== 1 ? "s" : ""} to review
          </p>
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h5 className="mb-5 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          Active Platforms
        </h5>
        <div className="space-y-2">
          {platforms.map(({ key, cfg, count }) => {
            const Icon = cfg.icon
            const pct = total > 0 ? Math.round((count / total) * 100) : 0
            const isSelected = selectedPlatform === key
            const isDimmed = selectedPlatform !== null && !isSelected
            return (
              <button
                key={key}
                type="button"
                onClick={() => onSelectPlatform(isSelected ? null : key)}
                className={cn(
                  "w-full rounded-lg px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "bg-muted ring-1 ring-border"
                    : "hover:bg-muted/60",
                  isDimmed && "opacity-40"
                )}
              >
                <div className="mb-1.5 flex justify-between text-[11px] font-bold">
                  <span className="flex items-center gap-1.5">
                    <Icon className="size-3.5 shrink-0" />
                    {cfg.label}
                  </span>
                  <span>{count > 0 ? `${pct}%` : "—"}</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: cfg.accentColor,
                    }}
                  />
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        <h5 className="mb-5 text-[10px] font-black tracking-widest text-muted-foreground uppercase">
          Intent Breakdown
        </h5>
        {intents.length === 0 ? (
          <p className="text-xs text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-3">
            {intents.map(({ key, label, count }) => (
              <div key={key} className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{label}</span>
                <span className="rounded-full border border-border bg-muted px-2 py-0.5 text-[11px] font-bold text-foreground">
                  {count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </aside>
  )
}
