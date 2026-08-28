import {
  IconArrowNarrowRight,
  IconArrowUpRight,
  IconExternalLink,
  IconLock,
} from "@tabler/icons-react"
import Image from "next/image"
import type { ReactElement } from "react"

import { IconBrandMentiohunt } from "@/components/custom-icons/brand-mentiohunt"
import { cn } from "@/lib/utils"

/* -------------------------------------------------------------------------- */
/*  Shared helpers                                                            */
/* -------------------------------------------------------------------------- */

export type ConceptProps = {
  /** Full URL of the customer site, e.g. "https://elevationvibe.com" */
  companyUrl: string
  /** Display name, e.g. "Elevation Vibe" */
  companyName: string
  /** Rendered height in px. Everything inside scales from this. */
  size?: number
  className?: string
}

export type ConceptComponent = (props: ConceptProps) => ReactElement

function getFaviconUrl(siteUrl: string): string {
  let domain = siteUrl
  try {
    domain = new URL(siteUrl).hostname
  } catch {
    domain = siteUrl
  }
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
}

function getHostname(siteUrl: string): string {
  try {
    return new URL(siteUrl).hostname.replace(/^www\./, "")
  } catch {
    return siteUrl
  }
}

/** Favicon in a light tile so dark glyphs stay visible in dark mode. */
function Favicon({
  companyUrl,
  px,
  radius = "9999px",
  ring = true,
  padding = 0.18,
  className,
}: {
  companyUrl: string
  px: number
  radius?: string
  ring?: boolean
  padding?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden bg-white",
        ring && "ring-1 ring-border/60",
        className,
      )}
      style={{ width: px, height: px, borderRadius: radius }}
    >
      <Image
        src={getFaviconUrl(companyUrl)}
        alt=""
        fill
        unoptimized
        className="object-contain"
        style={{ padding: `${padding * 100}%` }}
      />
    </div>
  )
}

/** The orange Mentiohunt disc. */
function MarkDisc({
  px,
  radius = "9999px",
  className,
}: {
  px: number
  radius?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center bg-[var(--color-princeton-orange)]",
        className,
      )}
      style={{ width: px, height: px, borderRadius: radius }}
    >
      <IconBrandMentiohunt className="h-[56%] w-[56%] text-white" />
    </div>
  )
}

/* ========================================================================== */
/*  CATEGORY A — icon / mark based                                            */
/* ========================================================================== */

/** 1. Orbit — the customer site orbits the Mentiohunt mark. */
export function ConceptOrbit({ companyUrl, size = 60, className }: ConceptProps) {
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 h-full w-full text-[var(--color-princeton-orange)]"
      >
        <circle
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          strokeDasharray="5 7"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <MarkDisc px={size * 0.54} />
      </div>

      <div className="absolute" style={{ left: "62%", top: "1%" }}>
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.36}
          ring={false}
          className="ring-2 ring-background"
        />
      </div>
    </div>
  )
}

/** 2. Venn — two translucent fields whose overlap is the shared audience. */
export function ConceptVenn({ companyUrl, size = 60, className }: ConceptProps) {
  const w = size * 1.55
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg viewBox="0 0 155 100" className="absolute inset-0 h-full w-full">
        <circle
          cx="58"
          cy="50"
          r="46"
          fill="var(--color-princeton-orange)"
          fillOpacity="0.42"
        />
        <circle
          cx="97"
          cy="50"
          r="46"
          fill="var(--color-foreground)"
          fillOpacity="0.16"
        />
      </svg>

      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ left: "6%" }}
      >
        <MarkDisc px={size * 0.34} />
      </div>
      <div
        className="absolute top-1/2 -translate-y-1/2"
        style={{ right: "6%" }}
      >
        <Favicon companyUrl={companyUrl} px={size * 0.34} />
      </div>
    </div>
  )
}

/** 3. Tab stack — the customer's page sitting on top of the Mentiohunt queue. */
export function ConceptTabStack({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.18
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <div
        className="absolute rounded-lg border border-border/70 bg-muted"
        style={{
          left: "12%",
          right: "12%",
          top: 0,
          height: size * 0.5,
        }}
      />
      <div
        className="absolute rounded-lg bg-[var(--color-amber-glow)]/45"
        style={{
          left: "6%",
          right: "6%",
          top: size * 0.14,
          height: size * 0.5,
        }}
      />
      <div
        className="absolute flex items-center justify-center overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        style={{ left: 0, right: 0, top: size * 0.3, height: size * 0.7 }}
      >
        <div
          className="absolute top-0 left-0 w-full bg-[var(--color-princeton-orange)]"
          style={{ height: Math.max(2, size * 0.05) }}
        />
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.34}
          radius="6px"
          ring={false}
          padding={0.05}
          className="mt-[8%] bg-transparent"
        />
      </div>
    </div>
  )
}

/** 4. Outbound arc — Mentiohunt reaching out to the site. */
export function ConceptOutboundArc({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.5
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg
        viewBox="0 0 150 100"
        className="absolute inset-0 h-full w-full text-[var(--color-princeton-orange)]"
      >
        <path
          d="M38 34 C 72 4, 112 12, 122 40"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.7"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="7 8"
        />
        <path d="M122 44 L114 28 L131 30 Z" fill="currentColor" />
      </svg>

      <div className="absolute bottom-0 left-0">
        <MarkDisc px={size * 0.6} radius="18%" />
      </div>
      <div className="absolute right-0 bottom-0">
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.46}
          radius="16%"
          padding={0.14}
        />
      </div>
    </div>
  )
}

/** 5. Sent mail — an outreach email with the site as its stamp. */
export function ConceptEnvelope({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.4
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <div className="absolute inset-0 overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <svg
          viewBox="0 0 140 100"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
        >
          <path
            d="M0 0 H140 L70 56 Z"
            fill="var(--color-princeton-orange)"
            fillOpacity="0.9"
          />
          <path
            d="M0 100 L52 52 M140 100 L88 52"
            stroke="var(--color-foreground)"
            strokeOpacity="0.12"
            strokeWidth="2"
          />
        </svg>

        <div
          className="absolute left-1/2 flex -translate-x-1/2 items-center justify-center"
          style={{
            top: size * 0.09,
            width: size * 0.22,
            height: size * 0.22,
          }}
        >
          <IconBrandMentiohunt className="h-full w-full text-white/95" />
        </div>
      </div>

      <div
        className="absolute"
        style={{ right: size * 0.1, bottom: size * 0.1 }}
      >
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.38}
          radius="4px"
          ring={false}
          padding={0.12}
          className="rotate-[-6deg] outline-2 outline-offset-1 outline-dashed outline-border"
        />
      </div>
    </div>
  )
}

/** 6. Link graph — two nodes joined by an edge, plus faint neighbours. */
export function ConceptLinkGraph({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.7
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg viewBox="0 0 170 100" className="absolute inset-0 h-full w-full">
        <path
          d="M52 50 H118"
          stroke="var(--color-princeton-orange)"
          strokeOpacity="0.8"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray="6 7"
        />
        <path
          d="M26 30 L8 12 M26 70 L8 88"
          stroke="var(--color-foreground)"
          strokeOpacity="0.22"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="6" cy="10" r="6" fill="var(--color-foreground)" fillOpacity="0.2" />
        <circle cx="6" cy="90" r="6" fill="var(--color-foreground)" fillOpacity="0.2" />
        <path
          d="M144 34 L162 18 M144 66 L162 82"
          stroke="var(--color-foreground)"
          strokeOpacity="0.22"
          strokeWidth="3"
          strokeLinecap="round"
        />
        <circle cx="164" cy="16" r="6" fill="var(--color-foreground)" fillOpacity="0.2" />
        <circle cx="164" cy="84" r="6" fill="var(--color-foreground)" fillOpacity="0.2" />
      </svg>

      <div className="absolute top-1/2 -translate-y-1/2" style={{ left: "9%" }}>
        <MarkDisc px={size * 0.5} />
      </div>
      <div className="absolute top-1/2 -translate-y-1/2" style={{ right: "9%" }}>
        <Favicon companyUrl={companyUrl} px={size * 0.44} />
      </div>
    </div>
  )
}

/** 7. Polaroid — the site framed like a photo, domain written on the lip. */
export function ConceptPolaroid({
  companyUrl,
  companyName,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 0.86
  const f = size / 60
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <div className="absolute inset-0 -rotate-3 rounded-md border border-border bg-white p-[7%] shadow-md dark:bg-neutral-100">
        <div
          className="relative flex w-full items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-[var(--color-amber-glow)]/35 to-[var(--color-blaze-orange)]/25"
          style={{ height: "70%" }}
        >
          <Favicon
            companyUrl={companyUrl}
            px={size * 0.34}
            radius="6px"
            ring={false}
            padding={0.08}
            className="bg-white/80"
          />
        </div>
        <p
          className="mt-[6%] truncate text-center font-medium text-neutral-700"
          style={{ fontSize: Math.max(4, 7.5 * f) }}
        >
          {companyName}
        </p>
      </div>
    </div>
  )
}

/** 8. Browser window — the customer's site open in a tab next to ours. */
export function ConceptBrowserWindow({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.62
  const f = size / 60
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <div
        className="absolute flex items-center gap-[4%] rounded-t-md bg-[var(--color-princeton-orange)] px-[3%]"
        style={{ left: "6%", top: 0, height: size * 0.16, width: size * 0.4 }}
      >
        <IconBrandMentiohunt className="h-[62%] w-auto text-white" />
      </div>

      <div
        className="absolute flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm"
        style={{ left: 0, right: 0, bottom: 0, top: size * 0.13 }}
      >
        <div
          className="flex shrink-0 items-center gap-[3%] border-b border-border/70 bg-muted/60 px-[4%]"
          style={{ height: size * 0.3 }}
        >
          <span
            className="rounded-full bg-foreground/20"
            style={{ width: size * 0.055, height: size * 0.055 }}
          />
          <span
            className="rounded-full bg-foreground/20"
            style={{ width: size * 0.055, height: size * 0.055 }}
          />
          <span
            className="rounded-full bg-foreground/20"
            style={{ width: size * 0.055, height: size * 0.055 }}
          />
          <span
            className="ml-[3%] flex min-w-0 flex-1 items-center gap-[4%] truncate rounded-full bg-background px-[4%] font-mono text-muted-foreground"
            style={{
              fontSize: Math.max(4, 6.5 * f),
              height: size * 0.17,
            }}
          >
            <IconLock size={Math.max(4, 6 * f)} stroke={2.5} />
            <span className="truncate">{getHostname(companyUrl)}</span>
          </span>
        </div>

        <div className="relative flex flex-1 items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{
              backgroundImage:
                "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
              backgroundSize: `${size * 0.16}px ${size * 0.16}px`,
            }}
          />
          <Favicon
            companyUrl={companyUrl}
            px={size * 0.32}
            radius="8px"
            ring={false}
            padding={0.06}
            className="-mt-[12%] bg-transparent"
          />
        </div>
      </div>
    </div>
  )
}

/** 9. Postage stamp — the site "stamped" as a shipped placement. */
export function ConceptPostageStamp({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn("relative", className)}
      style={{ width: size * 0.9, height: size }}
    >
      <div className="absolute inset-0 -rotate-[4deg] rounded-[3px] bg-white p-[6%] shadow-md dark:bg-neutral-100">
        <div className="relative flex h-full w-full flex-col items-center justify-center rounded-[2px] border border-dashed border-[var(--color-blaze-orange)]/60">
          <div
            className="absolute top-0 right-0 bg-[var(--color-princeton-orange)]"
            style={{
              width: size * 0.17,
              height: size * 0.17,
              clipPath: "polygon(100% 0, 0 0, 100% 100%)",
            }}
          />
          <Favicon
            companyUrl={companyUrl}
            px={size * 0.36}
            radius="4px"
            ring={false}
            padding={0.06}
            className="bg-transparent"
          />
          <p
            className="mt-[5%] font-mono font-bold tracking-[0.14em] text-neutral-500 uppercase"
            style={{ fontSize: Math.max(3.5, 5.5 * f) }}
          >
            Linked
          </p>
        </div>
      </div>
    </div>
  )
}

/* ========================================================================== */
/*  CATEGORY B — text / wordmark based                                        */
/* ========================================================================== */

/** 10. Route pill — mentiohunt.com → their domain, in one mono pill. */
export function ConceptRoutePill({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn(
        "inline-flex items-center gap-[0.55em] rounded-full border border-border bg-card shadow-sm",
        className,
      )}
      style={{
        fontSize: Math.max(8, 11 * f),
        paddingInline: 7 * f,
        paddingBlock: 5 * f,
      }}
    >
      <MarkDisc px={17 * f} />
      <span className="font-mono text-muted-foreground">mentiohunt.com</span>
      <IconArrowNarrowRight
        size={15 * f}
        stroke={2}
        className="text-[var(--color-princeton-orange)]"
      />
      <Favicon companyUrl={companyUrl} px={17 * f} radius="5px" padding={0.1} />
      <span className="pr-[0.35em] font-mono font-medium text-foreground">
        {getHostname(companyUrl)}
      </span>
    </div>
  )
}

/** 11. URL-bar chip — the live placement, address-bar style. */
export function ConceptUrlBarChip({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn(
        "inline-flex items-center gap-[0.6em] rounded-lg border border-border bg-muted/70",
        className,
      )}
      style={{
        fontSize: Math.max(8, 11 * f),
        paddingInline: 8 * f,
        paddingBlock: 6 * f,
      }}
    >
      <IconLock size={12 * f} stroke={2.4} className="text-muted-foreground" />
      <span className="font-mono text-foreground">
        {getHostname(companyUrl)}
      </span>
      <span
        className="bg-border"
        style={{ width: 1, height: 14 * f, marginInline: 2 * f }}
      />
      <span className="inline-flex items-center gap-[0.4em]">
        <MarkDisc px={14 * f} />
        <span className="font-medium whitespace-nowrap text-muted-foreground">
          linked via Mentiohunt
        </span>
      </span>
    </div>
  )
}

/** 12. Co-brand lockup — "Mentiohunt × Company" in one badge. */
export function ConceptCoBrandLockup({
  companyUrl,
  companyName,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-2xl border border-border bg-card shadow-sm",
        className,
      )}
      style={{
        gap: 10 * f,
        paddingInline: 12 * f,
        paddingBlock: 9 * f,
        fontSize: Math.max(9, 13 * f),
      }}
    >
      <span className="inline-flex items-center" style={{ gap: 6 * f }}>
        <MarkDisc px={20 * f} />
        <span className="font-heading font-semibold tracking-[-0.03em] text-foreground">
          Mentiohunt
        </span>
      </span>
      <span
        className="font-heading text-[var(--color-princeton-orange)]"
        style={{ fontSize: Math.max(9, 15 * f) }}
      >
        ×
      </span>
      <span className="inline-flex items-center" style={{ gap: 6 * f }}>
        <Favicon companyUrl={companyUrl} px={20 * f} radius="6px" padding={0.1} />
        <span className="font-heading font-semibold tracking-[-0.03em] text-foreground">
          {companyName}
        </span>
      </span>
    </div>
  )
}

/** 13. Byline rule — a typographic credit line, no container. */
export function ConceptBylineRule({
  companyUrl,
  companyName,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn("inline-flex items-stretch", className)}
      style={{ gap: 10 * f }}
    >
      <span
        className="rounded-full bg-[var(--color-princeton-orange)]"
        style={{ width: Math.max(2, 3 * f) }}
      />
      <span className="flex flex-col justify-center">
        <span
          className="font-bold tracking-[0.16em] text-[var(--color-blaze-orange)] uppercase"
          style={{ fontSize: Math.max(6, 8.5 * f) }}
        >
          Case study
        </span>
        <span
          className="mt-[0.25em] inline-flex items-center font-heading font-semibold tracking-[-0.03em] text-foreground"
          style={{ fontSize: Math.max(9, 15 * f), gap: 5 * f }}
        >
          <Favicon
            companyUrl={companyUrl}
            px={14 * f}
            radius="4px"
            padding={0.08}
          />
          {companyName}
        </span>
        <span
          className="font-mono text-muted-foreground"
          style={{ fontSize: Math.max(6, 9 * f) }}
        >
          {getHostname(companyUrl)}
        </span>
      </span>
    </div>
  )
}

/** 14. Ribbon — a rotated "case study" banner over the domain. */
export function ConceptRibbon({
  companyUrl,
  companyName,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn("inline-flex flex-col items-center", className)}
      style={{ gap: 7 * f }}
    >
      <span
        className="-rotate-2 bg-gradient-to-r from-[var(--color-blaze-orange)] to-[var(--color-amber-glow)] font-mono font-bold tracking-[0.18em] text-white uppercase shadow-sm"
        style={{
          fontSize: Math.max(6, 9 * f),
          paddingInline: 12 * f,
          paddingBlock: 5 * f,
          clipPath:
            "polygon(0% 0%, 100% 0%, 96% 50%, 100% 100%, 0% 100%, 4% 50%)",
        }}
      >
        Case study
      </span>
      <span
        className="inline-flex items-center font-heading font-semibold tracking-[-0.03em] text-foreground"
        style={{ fontSize: Math.max(9, 14 * f), gap: 6 * f }}
      >
        <Favicon
          companyUrl={companyUrl}
          px={16 * f}
          radius="5px"
          padding={0.1}
        />
        {companyName}
      </span>
    </div>
  )
}

/* ========================================================================== */
/*  CATEGORY C — abstract / diagrammatic                                      */
/* ========================================================================== */

/** 15. Backlink diagram — one page linking to another. */
export function ConceptBacklinkPages({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.75
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg
        viewBox="0 0 175 100"
        className="absolute inset-0 h-full w-full text-[var(--color-princeton-orange)]"
      >
        <path
          d="M62 74 C 82 96, 96 96, 114 76"
          fill="none"
          stroke="currentColor"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <path d="M118 80 L106 70 L120 66 Z" fill="currentColor" />
      </svg>

      {/* left page: the referring site */}
      <div
        className="absolute top-0 overflow-hidden rounded-lg border border-border bg-card p-[6%] shadow-sm"
        style={{ left: 0, width: size * 0.66, height: size * 0.82 }}
      >
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.17}
          radius="3px"
          ring={false}
          padding={0.04}
          className="bg-transparent"
        />
        <div
          className="mt-[10%] rounded-full bg-foreground/15"
          style={{ height: Math.max(2, size * 0.045), width: "85%" }}
        />
        <div
          className="mt-[7%] rounded-full bg-[var(--color-princeton-orange)]/70"
          style={{ height: Math.max(2, size * 0.045), width: "55%" }}
        />
        <div
          className="mt-[7%] rounded-full bg-foreground/15"
          style={{ height: Math.max(2, size * 0.045), width: "70%" }}
        />
      </div>

      {/* right page: the customer's article */}
      <div
        className="absolute overflow-hidden rounded-lg border border-[var(--color-princeton-orange)]/40 bg-card p-[6%] shadow-sm"
        style={{
          right: 0,
          top: size * 0.16,
          width: size * 0.66,
          height: size * 0.82,
        }}
      >
        <MarkDisc px={size * 0.17} radius="4px" />
        <div
          className="mt-[10%] rounded-full bg-foreground/15"
          style={{ height: Math.max(2, size * 0.045), width: "80%" }}
        />
        <div
          className="mt-[7%] rounded-full bg-foreground/15"
          style={{ height: Math.max(2, size * 0.045), width: "62%" }}
        />
        <div
          className="mt-[7%] rounded-full bg-foreground/15"
          style={{ height: Math.max(2, size * 0.045), width: "74%" }}
        />
      </div>
    </div>
  )
}

/** 16. Dotted route — two labelled endpoints joined by a travelled path. */
export function ConceptDottedRoute({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 2.1
  const f = size / 60
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg viewBox="0 0 210 100" className="absolute inset-0 h-full w-full">
        <path
          d="M34 40 C 74 4, 136 4, 176 40"
          fill="none"
          stroke="var(--color-princeton-orange)"
          strokeOpacity="0.8"
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="2 9"
        />
      </svg>

      <div
        className="absolute flex flex-col items-center"
        style={{ left: 0, top: size * 0.26 }}
      >
        <MarkDisc px={size * 0.3} />
        <span
          className="mt-[0.4em] font-mono whitespace-nowrap text-muted-foreground"
          style={{ fontSize: Math.max(6, 8.5 * f) }}
        >
          mentiohunt.com
        </span>
      </div>

      <div
        className="absolute flex flex-col items-center"
        style={{ right: 0, top: size * 0.26 }}
      >
        <Favicon companyUrl={companyUrl} px={size * 0.3} />
        <span
          className="mt-[0.4em] font-mono font-medium whitespace-nowrap text-foreground"
          style={{ fontSize: Math.max(6, 8.5 * f) }}
        >
          {getHostname(companyUrl)}
        </span>
      </div>
    </div>
  )
}

/** 17. Interlocking arcs — a chain link, drawn as two open brackets. */
export function ConceptInterlockingArcs({
  companyUrl,
  size = 60,
  className,
}: ConceptProps) {
  const w = size * 1.45
  return (
    <div
      className={cn("relative", className)}
      style={{ width: w, height: size }}
    >
      <svg viewBox="0 0 145 100" className="absolute inset-0 h-full w-full">
        <path
          d="M62 22 H36 A28 28 0 0 0 36 78 H62"
          fill="none"
          stroke="var(--color-princeton-orange)"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <path
          d="M83 22 H109 A28 28 0 0 1 109 78 H83"
          fill="none"
          stroke="var(--color-foreground)"
          strokeOpacity="0.28"
          strokeWidth="10"
          strokeLinecap="round"
        />
      </svg>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <Favicon
          companyUrl={companyUrl}
          px={size * 0.34}
          ring={false}
          className="ring-2 ring-background"
        />
      </div>
    </div>
  )
}

/** 18. Anchor text — the backlink itself, shown as live copy on their page. */
export function ConceptAnchorText({
  companyUrl,
  companyName,
  size = 60,
  className,
}: ConceptProps) {
  const f = size / 60
  return (
    <div
      className={cn(
        "inline-flex flex-col rounded-xl border border-border bg-card shadow-sm",
        className,
      )}
      style={{
        gap: 7 * f,
        paddingInline: 12 * f,
        paddingBlock: 10 * f,
        maxWidth: 320 * f,
      }}
    >
      <p
        className="leading-snug text-muted-foreground"
        style={{ fontSize: Math.max(8, 12 * f) }}
      >
        &ldquo;…the tool we use for this is{" "}
        <span className="font-semibold text-[var(--color-blaze-orange)] underline decoration-[var(--color-princeton-orange)] decoration-2 underline-offset-2">
          Mentiohunt
          <IconArrowUpRight
            size={10 * f}
            stroke={2.6}
            className="inline align-super"
          />
        </span>
        &rdquo;
      </p>
      <span
        className="inline-flex items-center border-t border-border/70 font-mono text-muted-foreground"
        style={{
          gap: 5 * f,
          paddingTop: 6 * f,
          fontSize: Math.max(6, 9 * f),
        }}
      >
        <Favicon
          companyUrl={companyUrl}
          px={12 * f}
          radius="3px"
          padding={0.08}
        />
        <span className="text-foreground">{getHostname(companyUrl)}</span>
        <IconExternalLink size={9 * f} stroke={2.2} />
        <span className="sr-only">{companyName}</span>
      </span>
    </div>
  )
}
