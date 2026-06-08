"use client"

import { IconCircleCheckFilled, IconMessageCircle, IconSparkles, IconThumbUp } from "@tabler/icons-react"
import { motion } from "framer-motion"

import { cn } from "@workspace/ui/lib/utils"
import type { MonitoringConfig, SampleMention } from "@/consts/community-monitoring"
import { PLATFORM_CONFIG } from "@/consts/platform-config"

const ease = [0.21, 0.47, 0.32, 0.98] as const

function FitScoreBar({ score }: { score: number }) {
  const { barColor, textClass } =
    score >= 85
      ? { barColor: "#22c55e", textClass: "text-green-600" }
      : score >= 70
        ? { barColor: "#f59e0b", textClass: "text-amber-600" }
        : { barColor: "#f97316", textClass: "text-orange-600" }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <span className={cn("text-[9px] font-bold uppercase tracking-wider", textClass)}>
        Fit Score
      </span>
      <div className="flex items-center gap-1.5">
        <div className="h-1 w-16 overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${score}%`, backgroundColor: barColor }}
          />
        </div>
        <span className={cn("text-xs font-bold tabular-nums", textClass)}>{score}</span>
      </div>
    </div>
  )
}

function SampleCard({
  mention,
  accentColor,
  platformLabel,
  platformColorClass,
  PlatformIcon,
  index,
}: {
  mention: SampleMention
  accentColor: string
  platformLabel: string
  platformColorClass: string
  PlatformIcon: React.ComponentType<{ className?: string }>
  index: number
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: 0.35 + index * 0.12, ease }}
      className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-[0_4px_20px_-6px_rgba(0,0,0,0.08)]"
    >
      {/* Left accent */}
      <div className="absolute left-0 top-0 h-full w-0.5" style={{ backgroundColor: accentColor }} />

      <div className="p-4 pl-5">
        {/* Header */}
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
              style={{ backgroundColor: accentColor === "#000000" ? "#27272a" : accentColor }}
            >
              {mention.authorName.replace(/^[@]/, "").slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="text-xs font-bold text-foreground">{mention.authorName}</p>
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    platformColorClass
                  )}
                >
                  <PlatformIcon className="size-2.5" />
                  {platformLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
                  {mention.intent}
                </span>
              </div>
              <p className="mt-0.5 text-[10px] text-muted-foreground">
                {mention.handle} · {mention.postedAt}
              </p>
            </div>
          </div>
          <div className="shrink-0">
            <FitScoreBar score={mention.fitScore} />
          </div>
        </div>

        {/* Post text */}
        <p className="mb-3 line-clamp-2 text-xs leading-5 text-foreground/90">
          {mention.text}
        </p>

        {/* Engagement */}
        <div className="mb-3 flex items-center gap-4 text-[10px] font-medium text-muted-foreground">
          <span className="flex items-center gap-1">
            <IconThumbUp className="size-3" />
            {mention.reactions}
          </span>
          <span className="flex items-center gap-1">
            <IconMessageCircle className="size-3" />
            {mention.comments} comments
          </span>
        </div>

        {/* Reply draft */}
        <div className="rounded-xl border border-border bg-muted/40 p-3">
          <div className="mb-1.5 flex items-center gap-1.5">
            <IconSparkles className="size-3 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
              Suggested Reply
            </span>
          </div>
          <p className="line-clamp-2 text-[11px] leading-5 text-foreground/80">
            {mention.replyDraft}
          </p>
        </div>
      </div>
    </motion.div>
  )
}

export function MonitoringFeedPreview({ config }: { config: MonitoringConfig }) {
  const platformCfg = PLATFORM_CONFIG[config.platform]
  const PlatformIcon = platformCfg.icon as React.ComponentType<{ className?: string }>

  return (
    <div className="relative overflow-hidden rounded-[1.75rem] border border-border bg-card shadow-[0_24px_80px_-32px_rgba(0,0,0,0.18)]">
      {/* Top gradient line */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[var(--color-blaze-orange)]/50 to-transparent" />

      {/* Header chrome */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div className="size-2.5 rounded-full bg-muted-foreground/20" />
            <div className="size-2.5 rounded-full bg-muted-foreground/20" />
            <div className="size-2.5 rounded-full bg-muted-foreground/20" />
          </div>
          <span className="text-xs font-semibold text-muted-foreground">
            {platformCfg.label} Monitoring — Reply Queue
          </span>
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="flex items-center gap-1.5 text-[10px] font-semibold text-green-600"
        >
          <IconCircleCheckFilled className="size-3" />
          Live
        </motion.div>
      </div>

      {/* Cards area */}
      <div className="relative p-4">
        <div className="space-y-3">
          {config.sample.map((mention, i) => (
            <SampleCard
              key={mention.authorName}
              mention={mention}
              accentColor={platformCfg.accentColor}
              platformLabel={platformCfg.label}
              platformColorClass={platformCfg.color}
              PlatformIcon={PlatformIcon}
              index={i}
            />
          ))}
        </div>

        {/* Bottom fade */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card to-transparent" />
      </div>
    </div>
  )
}
