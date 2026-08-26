"use client"

import { IconStar } from "@tabler/icons-react"
import { cn } from "@workspace/ui/lib/utils"
import Image from "next/image"

// PLACEHOLDER — swap for a real customer result before launch.
const RESULT_DOMAIN = "sunsama.com"

const TESTIMONIAL = {
  quote:
    "This tool found an opportunity on one of the sites with most authority in my niche, and I got a backlink in 12 days without paying for it, crazy!",
  author: "Logan Stuart",
  role: "Founder of Elevationvibe",
  avatar: "/landing/user-testimonial.webp",
}

const TIMELINE = [
  { day: "Day 0", title: "We find your 5 most important pages" },
  { day: "Day 1", title: "52 relevant sites found and ranked by fit" },
  { day: "Day 2", title: "Outreach starts automatically" },
  { day: "Day 9", title: "A reply comes in 👀" },
] as const

const RESULT_STATS = [
  { value: "12 days", label: "to first backlink" },
  { value: "DR 61", label: "domain rating" },
  { value: "$0", label: "placement cost" },
] as const

const REVIEW_FACES = [
  "/landing/user_2.webp",
  "/landing/user_3.webp",
  "/landing/user_4.webp",
  "/landing/user_5.webp",
  "/landing/user_1.webp",
]

export function OnboardingVisual() {
  return (
    <div className="flex w-full max-w-md flex-col gap-6">
      <div className="rounded-2xl border border-border/80 bg-card p-5 shadow-sm shadow-black/[0.03]">
        <p className="text-[0.95rem] leading-6 font-medium text-foreground">
          &ldquo;{TESTIMONIAL.quote}&rdquo;
        </p>
        <div className="mt-4 flex items-center gap-2.5">
          <Image
            src={TESTIMONIAL.avatar}
            alt=""
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full object-cover"
          />
          <div className="min-w-0 text-xs">
            <p className="truncate font-semibold text-foreground">
              {TESTIMONIAL.author}
            </p>
            <p className="mt-0.5 truncate text-muted-foreground">
              {TESTIMONIAL.role}
            </p>
          </div>
        </div>
      </div>

      <div>
        <p className="mb-4 text-[0.7rem] font-bold tracking-wide text-primary uppercase">
          How that link happened
        </p>

        <div className="flex flex-col">
          {TIMELINE.map((step, index) => (
            <TimelineRow key={step.day} day={step.day} isFirst={index === 0}>
              <p className="text-sm leading-snug text-foreground">
                {step.title}
              </p>
            </TimelineRow>
          ))}

          <TimelineRow day="Day 12" isLive isLast>
            <div className="flex items-center gap-2">
              {/* Google's favicon service isn't in next.config remotePatterns,
                  so this stays a plain img — same as the Launch step. */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://www.google.com/s2/favicons?domain=${RESULT_DOMAIN}&sz=64`}
                alt=""
                className="h-4 w-4 shrink-0 rounded-sm"
              />
              <p className="text-sm font-semibold tracking-tight text-foreground">
                Live on {RESULT_DOMAIN}
              </p>
            </div>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold text-primary">
                DR 61
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-current" />
                Still live
              </span>
            </div>
          </TimelineRow>
        </div>
      </div>

      <div className="grid grid-cols-3 border-t border-border pt-5">
        {RESULT_STATS.map(({ value, label }, index) => (
          <div
            key={label}
            className={cn(index > 0 && "border-l border-border/70 pl-5")}
          >
            <div className="font-heading text-xl leading-tight font-semibold tracking-tight text-foreground">
              {value}
            </div>
            <div className="mt-0.5 text-xs text-muted-foreground">{label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex items-center gap-3">
          <div className="flex shrink-0">
            {REVIEW_FACES.map((src, index) => (
              <span
                key={src}
                className="relative h-8 w-8 overflow-hidden rounded-full border-2 border-background shadow-sm"
                style={{ marginLeft: index === 0 ? 0 : "-0.5rem" }}
              >
                <Image
                  src={src}
                  alt=""
                  fill
                  sizes="32px"
                  className="object-cover"
                />
              </span>
            ))}
          </div>
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <IconStar
                key={index}
                size={15}
                className="fill-amber-400 text-amber-400"
              />
            ))}
            <span className="ml-1 text-sm font-bold text-foreground">4.8</span>
            <span className="text-sm font-medium text-muted-foreground">
              /5
            </span>
          </div>
        </div>
        <p className="text-sm leading-5 font-medium text-muted-foreground">
          Trusted by{" "}
          <span className="font-semibold text-foreground">700+ founders</span>{" "}
          earning relevant backlinks
        </p>
      </div>
    </div>
  )
}

/**
 * The spine is drawn as two segments meeting at the dot's center, so no line
 * ever pokes out above the first dot or below the last one.
 */
function TimelineRow({
  day,
  isFirst = false,
  isLive = false,
  isLast = false,
  children,
}: {
  day: string
  isFirst?: boolean
  isLive?: boolean
  isLast?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="grid grid-cols-[2.75rem_1.25rem_1fr] gap-3">
      <span className="pt-px text-right font-mono text-[11px] font-semibold text-muted-foreground tabular-nums">
        {day}
      </span>
      <div className="relative flex justify-center">
        {!isFirst && (
          <span className="absolute top-0 h-[11px] w-px bg-border" />
        )}
        {!isLast && (
          <span className="absolute top-[11px] bottom-0 w-px bg-border" />
        )}
        <span
          className={cn(
            "relative mt-1.5 h-2.5 w-2.5 rounded-full border-[1.5px]",
            isLive ? "border-primary bg-primary" : "border-border bg-background"
          )}
          style={
            isLive
              ? {
                  boxShadow:
                    "0 0 0 4px color-mix(in oklch, var(--blaze-orange) 16%, transparent)",
                }
              : undefined
          }
        />
      </div>
      <div className={cn(isLast ? "pb-0" : "pb-8")}>{children}</div>
    </div>
  )
}
