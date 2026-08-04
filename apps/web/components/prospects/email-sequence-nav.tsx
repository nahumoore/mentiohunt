"use client"

import {
  IconCheck,
  IconClockHour4,
  IconClockPause,
  IconMailCheck,
} from "@tabler/icons-react"
import { isPast } from "date-fns"
import { cn } from "@workspace/ui/lib/utils"

import { formatRelative } from "@/lib/format-date"

export type SequenceStep = {
  number: number
  label: string
  status: "sent" | "scheduled" | "trial_expired"
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
        const isTrialExpired = step.status === "trial_expired"
        const isActive = idx === activeIdx
        const isPastStep = idx < activeIdx
        const isLast = idx === steps.length - 1
        // Step 2/3 dates are set when the sequence is first created, so a
        // slow-to-send earlier step can leave this one's date in the past
        // while it's still just waiting in the queue, not overdue/broken.
        const isQueued = !isSent && !isTrialExpired && isPast(step.date)

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
                      : isSent || isPastStep
                        ? "border-primary bg-primary"
                        : "border-border bg-background group-hover:border-primary/40"
                  )}
                >
                  {(isSent || isPastStep) && !isActive && (
                    <IconCheck className="size-2 text-white" strokeWidth={3} />
                  )}
                </div>
                {!isLast && (
                  <div
                    className={cn(
                      "h-px flex-1 transition-colors duration-300",
                      isSent || isPastStep ? "bg-primary/35" : "bg-border"
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
                      : isSent || isPastStep
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
                      : isSent || isPastStep
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
                  ) : isTrialExpired ? (
                    <span className="inline-flex items-center gap-0.5 text-[10px] font-semibold text-(--color-blaze-orange)">
                      <IconClockPause className="size-3" />
                      Paused
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground/40">
                      <IconClockHour4 className="size-3" />
                      {isQueued ? "Queued" : "Scheduled"}
                    </span>
                  )}
                  <span className="text-[10px] text-muted-foreground/25">·</span>
                  <span className="text-[10px] text-muted-foreground/35">
                    {isTrialExpired ? "Trial expired" : isQueued ? "Sending shortly" : formatRelative(step.date)}
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
