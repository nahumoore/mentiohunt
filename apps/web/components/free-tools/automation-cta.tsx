import Link from "next/link"
import { IconArrowRight, IconSparkles } from "@tabler/icons-react"

export function AutomationCta({
  eyebrow,
  heading,
  body,
  ctaLabel = "See how it works",
  ctaHref = "/#how-it-works",
  helperText,
}: {
  eyebrow: string
  heading: string
  body: string
  ctaLabel?: string
  ctaHref?: string
  helperText?: string
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-[var(--color-blaze-orange-2)] via-[var(--color-blaze-orange)] to-[var(--color-amber-flame)] p-8 shadow-[0_28px_90px_-40px_rgba(255,96,0,0.65)] sm:p-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_15%,rgba(255,255,255,0.16),transparent_55%)]" />
      <div className="relative flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-2xl">
          <span className="inline-flex items-center gap-2 text-[0.7rem] font-bold uppercase tracking-[0.16em] text-white/90">
            <IconSparkles size={14} stroke={2.4} />
            {eyebrow}
          </span>
          <h2 className="mt-3 font-heading text-3xl font-semibold tracking-tight text-balance text-white sm:text-4xl">
            {heading}
          </h2>
          <p className="mt-3 text-base leading-7 text-white/90 text-pretty">
            {body}
          </p>
        </div>

        <div className="flex shrink-0 flex-col items-start gap-3">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-2 rounded-full bg-white px-7 py-4 text-sm font-bold text-(--color-blaze-orange) shadow-sm transition-transform hover:-translate-y-0.5"
          >
            {ctaLabel}
            <IconArrowRight size={16} stroke={2.5} />
          </Link>
          {helperText && (
            <span className="text-xs text-white/85">{helperText}</span>
          )}
        </div>
      </div>
    </div>
  )
}
