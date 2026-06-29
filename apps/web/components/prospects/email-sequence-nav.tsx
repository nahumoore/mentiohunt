"use client"

import {
  IconCheck,
  IconClockHour4,
  IconMailCheck,
} from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"

import { formatRelative } from "@/lib/format-date"

export type SequenceStep = {
  number: number
  label: string
  status: "sent" | "scheduled"
  date: Date
}

type NavProps = {
  steps: SequenceStep[]
  activeIdx: number
  onSelect: (idx: number) => void
}

export function EmailSequenceNav({ steps, activeIdx, onSelect }: NavProps) {
  return (
    <div className="mb-5 flex w-full items-start">
      {steps.map((step, idx) => {
        const isSent = step.status === "sent"
        const isActive = idx === activeIdx
        const isPast = idx < activeIdx
        const isLast = idx === steps.length - 1

        return (
          <div key={step.number} className="flex flex-1 items-start">
            <button
              type="button"
              onClick={() => onSelect(idx)}
              className="group flex flex-1 flex-col items-start gap-2.5 text-left"
            >
              {/* Rail + dot */}
              <div className="flex w-full items-center">
                <div
                  className={cn(
                    "relative z-10 flex size-3.5 shrink-0 items-center justify-center rounded-full border-[1.5px] transition-all duration-150",
                    isActive
                      ? "border-primary bg-primary shadow-[0_0_0_4px_rgba(255,84,0,0.12)]"
                      : isSent || isPast
                        ? "border-primary bg-primary"
                        : "border-border bg-background group-hover:border-primary/40"
                  )}
                >
                  {(isSent || isPast) && !isActive && (
                    <IconCheck className="size-2 text-white" strokeWidth={3} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-colors duration-300",
                      isSent || isPast ? "bg-primary/35" : "bg-border"
                    )}
                  />
                )}
              </div>

              {/* Label cluster */}
              <div className="space-y-0.5">
                <p
                  className={cn(
                    "text-[10px] font-bold uppercase tracking-[0.12em] transition-colors",
                    isActive
                      ? "text-primary"
                      : isSent || isPast
                        ? "text-primary/55"
                        : "text-muted-foreground/35"
                  )}
                >
                  Email {step.number}
                </p>
                <p
                  className={cn(
                    "text-[11px] font-medium leading-snug transition-colors",
                    isActive
                      ? "text-foreground"
                      : isSent || isPast
                        ? "text-foreground/60"
                        : "text-muted-foreground/35"
                  )}
                >
                  {step.label}
                </p>
                <div className="flex items-center gap-1 pt-0.5">
                  {isSent ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600">
                      <IconMailCheck className="size-3" />
                      Sent
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40">
                      <IconClockHour4 className="size-3" />
                      Scheduled
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/25">·</span>
                  <span className="text-[10px] text-muted-foreground/35">
                    {formatRelative(step.date)}
                  </span>
                </div>
              </div>
            </button>
          </div>
        )
      })}
    </div>
  )
}
