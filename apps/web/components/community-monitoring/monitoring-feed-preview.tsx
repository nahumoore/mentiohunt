"use client"

import type { ComponentType } from "react"
import {
  IconBrandLinkedin,
  IconBrandYoutube,
  IconMessageCircle,
  IconSparkles,
  IconThumbUp,
} from "@tabler/icons-react"
import { motion } from "framer-motion"

import { cn } from "@workspace/ui/lib/utils"
import type { MonitoringConfig, PlatformIconKey, SampleMention } from "@/consts/community-monitoring"
import { IconBrandFacebookCustom } from "@/components/custom-icons/brand-facebook"
import { IconBrandGoogle } from "@/components/custom-icons/brand-google"
import { IconBrandRedditNew } from "@/components/custom-icons/brand-reddit-new"
import { IconBrandXCustom } from "@/components/custom-icons/brand-x"

const PLATFORM_ICONS: Record<PlatformIconKey, ComponentType<{ className?: string }>> = {
  x: IconBrandXCustom,
  reddit: IconBrandRedditNew,
  facebook: IconBrandFacebookCustom,
  youtube: IconBrandYoutube,
  linkedin: IconBrandLinkedin,
  google: IconBrandGoogle,
}

const ease = [0.21, 0.47, 0.32, 0.98] as const

function FitScore({ score }: { score: number }) {
  const textClass =
    score >= 85
      ? "text-green-600"
      : score >= 70
        ? "text-amber-600"
        : "text-orange-600"
  return (
    <div className="flex shrink-0 flex-col items-end">
      <span className={cn("text-base font-black tabular-nums", textClass)}>{score}</span>
      <span className="text-[0.44rem] font-bold text-muted-foreground/40 uppercase">
        fit
      </span>
    </div>
  )
}

function TickerCard({
  mention,
  accentColor,
  platformColorClass,
  PlatformIcon,
  platformLabel,
}: {
  mention: SampleMention
  accentColor: string
  platformColorClass: string
  PlatformIcon: ComponentType<{ className?: string }>
  platformLabel: string
}) {
  return (
    <div className="relative flex h-[210px] w-[300px] shrink-0 flex-col overflow-hidden rounded-xl border border-border/70 bg-card px-4 py-3.5 shadow-sm">
      {/* Left accent */}
      <div
        className="absolute left-0 top-0 h-full w-0.5"
        style={{ backgroundColor: accentColor }}
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-2 pl-1">
        <div className="flex min-w-0 items-center gap-2">
          <div
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold text-white"
            style={{ backgroundColor: accentColor }}
          >
            {mention.authorName.replace(/^[@u/]/, "").slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-[0.62rem] font-bold text-foreground">
              {mention.authorName}
            </p>
            <div className="flex items-center gap-1">
              <span
                className={cn(
                  "inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-medium",
                  platformColorClass
                )}
              >
                <PlatformIcon className="size-2" />
                {platformLabel}
              </span>
              <span className="inline-flex max-w-[80px] items-center truncate rounded-full bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                {mention.intent}
              </span>
            </div>
          </div>
        </div>
        <FitScore score={mention.fitScore} />
      </div>

      {/* Post text */}
      <p className="mt-2 line-clamp-2 pl-1 text-[0.72rem] leading-5 text-foreground/80">
        &ldquo;{mention.text}&rdquo;
      </p>

      {/* Engagement */}
      <div className="mt-1.5 flex items-center gap-3 pl-1 text-[10px] text-muted-foreground/60">
        <span className="flex items-center gap-1">
          <IconThumbUp className="size-2.5" />
          {mention.reactions}
        </span>
        <span className="flex items-center gap-1">
          <IconMessageCircle className="size-2.5" />
          {mention.comments}
        </span>
      </div>

      {/* Reply draft */}
      <div className="mt-auto border-t border-border/60 pt-2 pl-1">
        <div className="flex items-start gap-1.5">
          <IconSparkles className="mt-0.5 size-3 shrink-0 text-primary" />
          <p className="line-clamp-2 text-[0.65rem] leading-4 text-muted-foreground">
            {mention.replyDraft}
          </p>
        </div>
      </div>
    </div>
  )
}

export function MonitoringFeedPreview({ config }: { config: MonitoringConfig }) {
  const platformCfg = config.platformDisplay
  const PlatformIcon = PLATFORM_ICONS[platformCfg.iconKey]

  // 4 copies per half → 8 copies total, animate -50%
  // each half = 12 cards × 316px ≈ 3792px — wider than any viewport
  const half = [
    ...config.sample,
    ...config.sample,
    ...config.sample,
    ...config.sample,
  ]
  const items = [...half, ...half]

  return (
    <motion.div
      className="pb-20 pt-2"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8, delay: 0.44, ease }}
    >
      <div className="relative overflow-hidden">
        {/* Edge fades */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-gradient-to-r from-background to-transparent"
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-gradient-to-l from-background to-transparent"
          aria-hidden="true"
        />

        <div
          className="flex w-max gap-4 py-2"
          style={{ animation: "monitoring-ticker 38s linear infinite" }}
        >
          {items.map((mention, i) => (
            <TickerCard
              key={i}
              mention={mention}
              accentColor={platformCfg.accentColor}
              platformColorClass={platformCfg.color}
              PlatformIcon={PlatformIcon}
              platformLabel={platformCfg.label}
            />
          ))}
        </div>

        <style>{`
          @keyframes monitoring-ticker {
            from { transform: translateX(0); }
            to   { transform: translateX(-50%); }
          }
        `}</style>
      </div>
    </motion.div>
  )
}
