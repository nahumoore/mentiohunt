import Image from "next/image"

import { cn } from "@/lib/utils"

function getFaviconUrl(siteUrl: string): string | undefined {
  try {
    const domain = new URL(siteUrl).hostname
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`
  } catch {
    return undefined
  }
}

export function CaseStudyMark({
  companyUrl,
  companyName,
  size = 60,
  className,
}: {
  companyUrl?: string
  companyName?: string
  size?: number
  className?: string
}) {
  const faviconUrl = companyUrl ? getFaviconUrl(companyUrl) : undefined
  const f = size / 60

  return (
    <div
      className={cn("inline-flex flex-col items-center", className)}
      style={{ gap: 10 * f }}
    >
      <span
        className="-rotate-2 bg-gradient-to-r from-[var(--color-blaze-orange)] to-[var(--color-amber-glow)] font-mono font-bold tracking-[0.2em] text-white uppercase shadow-[0_10px_30px_-12px_rgba(255,133,0,0.6)]"
        style={{
          fontSize: 9 * f,
          paddingInline: 14 * f,
          paddingBlock: 6 * f,
          clipPath:
            "polygon(0% 0%, 100% 0%, 96% 50%, 100% 100%, 0% 100%, 4% 50%)",
        }}
      >
        Case study
      </span>
      <span
        className="inline-flex items-center font-heading font-semibold tracking-[-0.03em] text-foreground"
        style={{ fontSize: 15 * f, gap: 8 * f }}
      >
        {faviconUrl && (
          <span
            className="relative shrink-0 overflow-hidden rounded-md bg-white shadow-sm ring-1 ring-border/50"
            style={{ width: 18 * f, height: 18 * f }}
          >
            <Image
              src={faviconUrl}
              alt=""
              fill
              unoptimized
              className="object-contain p-1"
            />
          </span>
        )}
        {companyName}
      </span>
    </div>
  )
}

export function CaseStudyIllustration({
  companyUrl,
  companyName,
  className,
}: {
  companyUrl?: string
  companyName?: string
  className?: string
}) {
  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden bg-gradient-to-br from-muted/70 to-muted/20",
        className,
      )}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-foreground) 1px, transparent 1px), linear-gradient(90deg, var(--color-foreground) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
      />
      <div className="pointer-events-none absolute -top-10 -right-10 h-40 w-40 rounded-full bg-[var(--color-princeton-orange)]/12 blur-[70px]" />
      <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-[var(--color-amber-glow)]/12 blur-[70px]" />

      <CaseStudyMark
        companyUrl={companyUrl}
        companyName={companyName}
        size={64}
        className="relative sm:hidden"
      />
      <CaseStudyMark
        companyUrl={companyUrl}
        companyName={companyName}
        size={84}
        className="relative hidden sm:inline-flex"
      />
    </div>
  )
}
