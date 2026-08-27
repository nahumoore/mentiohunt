"use client"

import { IconStar } from "@tabler/icons-react"
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

const REVIEW_FACES = [
  "/landing/user_2.webp",
  "/landing/user_3.webp",
  "/landing/user_4.webp",
  "/landing/user_5.webp",
  "/landing/user_1.webp",
]

export function OnboardingVisual() {
  return (
    <div className="flex w-full max-w-sm flex-col">
      <div className="flex items-baseline gap-2">
        <span className="font-heading text-[5.5rem] leading-[0.85] font-semibold tracking-[-0.05em] text-foreground tabular-nums">
          12
        </span>
        <span className="font-heading text-2xl leading-none font-semibold tracking-tight text-foreground">
          days
        </span>
      </div>

      <p className="mt-6 max-w-[20ch] text-[1.15rem] leading-snug font-medium tracking-tight text-foreground">
        from finishing setup to a live backlink you didn&rsquo;t pay for.
      </p>

      <div className="mt-7 rounded-2xl border border-border/80 bg-card p-4 shadow-sm shadow-black/[0.03]">
        <div className="flex items-center gap-2.5">
          {/* Google's favicon service isn't in next.config remotePatterns,
              so this stays a plain img. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://www.google.com/s2/favicons?domain=${RESULT_DOMAIN}&sz=64`}
            alt=""
            className="h-5 w-5 shrink-0 rounded"
          />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight text-foreground">
              {RESULT_DOMAIN}
            </p>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Live since day 12 &middot; earned with one email
            </p>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-1.5">
          <span className="rounded-full bg-primary/10 px-2.5 py-1 text-[0.65rem] font-semibold text-primary">
            DR 61
          </span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[0.65rem] font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            Still live
          </span>
        </div>
      </div>

      <div className="my-7 h-px w-full bg-border" />

      <p className="max-w-[34ch] text-sm leading-6 text-foreground">
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

      <div className="mt-7 flex items-center gap-3 border-t border-border pt-6">
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
        <div className="min-w-0">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, index) => (
              <IconStar
                key={index}
                size={14}
                className="fill-amber-400 text-amber-400"
              />
            ))}
            <span className="ml-1 text-sm font-bold text-foreground">4.8</span>
            <span className="text-sm font-medium text-muted-foreground">/5</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Trusted by{" "}
            <span className="font-semibold text-foreground">700+ founders</span>
          </p>
        </div>
      </div>
    </div>
  )
}
