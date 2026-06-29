"use client"

import {
  IconCircleCheck,
  IconCircleX,
  IconLink,
  IconSend,
  IconSparkles,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import type { ProspectStatus } from "@/app/dashboard/prospects/_data"
import type { ProspectListItem } from "@/stores/prospect-store"

type StageValue = "all" | ProspectStatus

interface Props {
  prospects: ProspectListItem[]
  activeStage: StageValue
  onStageChange: (stage: StageValue) => void
}

const PIPELINE = [
  {
    value: "new" as ProspectStatus,
    label: "New",
    icon: IconSparkles,
    activeBg: "#dbeafe",
    activeText: "#1d4ed8",
    activeIcon: "#3b82f6",
  },
  {
    value: "contacted" as ProspectStatus,
    label: "Contacted",
    icon: IconSend,
    activeBg: "#fff0e6",
    activeText: "#c2410c",
    activeIcon: "#ff5400",
  },
  {
    value: "negotiating" as ProspectStatus,
    label: "Negotiating",
    icon: IconLink,
    activeBg: "#fefce8",
    activeText: "#a16207",
    activeIcon: "#ca8a04",
  },
  {
    value: "won" as ProspectStatus,
    label: "Won",
    icon: IconCircleCheck,
    activeBg: "#dcfce7",
    activeText: "#15803d",
    activeIcon: "#16a34a",
  },
  {
    value: "dismissed" as ProspectStatus,
    label: "Dismissed",
    icon: IconCircleX,
    activeBg: "#fef2f2",
    activeText: "#b91c1c",
    activeIcon: "#ef4444",
    selectedBg: "#fef2f2",
    selectedText: "#b91c1c",
    selectedIcon: "#ef4444",
  },
]

function countFor(prospects: ProspectListItem[], status: ProspectStatus) {
  return prospects.filter((p) => p.status === status).length
}

// Arrow depth and half-height must match: HALF_H * 2 = container height.
const ARROW = 20
const HALF_H = 38

export function StatusOverviewV1({ prospects, activeStage, onStageChange }: Props) {
  const isAllActive = activeStage === "all"

  return (
    <div className="flex w-full items-stretch gap-2">
      {/* Chevron pipeline — decreasing z-index so each segment's arrow
          sits on top of the next segment's left edge, filling the notch.
          No overflow-hidden so hover scale is not clipped; border-radius
          applied directly to first/last buttons instead. */}
      <div
        className="flex min-w-0 flex-1 rounded-xl border border-border"
        style={{ height: HALF_H * 2 }}
      >

        {PIPELINE.map((stage, i) => {
          const count = countFor(prospects, stage.value)
          const isActive = isAllActive || activeStage === stage.value
          const isSelected = activeStage === stage.value
          const isFirst = i === 0
          const isLast = i === PIPELINE.length - 1
          const Icon = stage.icon
          const resolvedBg = isSelected && "selectedBg" in stage ? stage.selectedBg : stage.activeBg
          const resolvedText = isSelected && "selectedText" in stage ? stage.selectedText : stage.activeText
          const resolvedIcon = isSelected && "selectedIcon" in stage ? stage.selectedIcon : stage.activeIcon
          const bgColor = isActive ? resolvedBg : "#f5f5f5"

          return (
            <button
              key={stage.value}
              type="button"
              onClick={() => onStageChange(isSelected ? "all" : stage.value)}
              className={cn(
                "group relative flex flex-1 flex-col items-center justify-center gap-1 transition-all duration-150 ease-out",
                isFirst && "rounded-l-xl",
                isLast && "rounded-r-xl",
                !isSelected && [
                  "hover:scale-[1.04] hover:-translate-y-px",
                  // left/top/bottom straight border
                  "hover:border-l hover:border-t hover:border-b hover:border-border",
                  // last segment gets a straight right border too
                  isLast && "hover:border-r",
                ]
              )}
              style={{
                backgroundColor: bgColor,
                zIndex: PIPELINE.length - i,
                paddingLeft: isFirst ? 0 : ARROW,
              }}
            >
              {/* Right-pointing arrow fill — extends into next segment's space */}
              {!isLast && (
                <span
                  className="pointer-events-none absolute right-0 top-0"
                  style={{
                    width: 0,
                    height: 0,
                    borderTop: `${HALF_H}px solid transparent`,
                    borderBottom: `${HALF_H}px solid transparent`,
                    borderLeft: `${ARROW}px solid ${isActive ? resolvedBg : "#f5f5f5"}`,
                    transform: "translateX(100%)",
                    transition: "border-left-color 150ms ease-out",
                  }}
                />
              )}

              {/* Arrow-shaped border outline — only visible on hover of unselected */}
              {!isLast && !isSelected && (
                <svg
                  className="pointer-events-none absolute right-0 top-0 opacity-0 transition-opacity duration-150 group-hover:opacity-100"
                  style={{ transform: "translateX(100%)" }}
                  width={ARROW}
                  height={HALF_H * 2}
                  viewBox={`0 0 ${ARROW} ${HALF_H * 2}`}
                  overflow="visible"
                >
                  <polyline
                    points={`0,0 ${ARROW},${HALF_H} 0,${HALF_H * 2}`}
                    fill="none"
                    stroke="var(--border)"
                    strokeWidth="1"
                  />
                </svg>
              )}

              <Icon
                className="size-[15px] transition-colors duration-150"
                style={{ color: isActive ? resolvedIcon : "#c0c0c0" }}
              />
              <span
                className="font-heading tabular-nums text-2xl font-bold leading-none transition-colors duration-150"
                style={{ color: isActive ? resolvedText : "#c0c0c0" }}
              >
                {count}
              </span>
              <span
                className="text-[10px] font-semibold uppercase transition-colors duration-150"
                style={{
                  color: isActive ? resolvedIcon : "#c0c0c0",
                  letterSpacing: "0.15em",
                }}
              >
                {stage.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
