import { IconCheck, IconMinus, IconX } from "@tabler/icons-react"
import type { CSSProperties } from "react"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"

type Support = "yes" | "partial" | "no"

type Feature = {
  label: string
  seoTools: Support
  outreachPlatforms: Support
  manual: Support
  mentiohunt: Support
}

const features: Feature[] = [
  {
    label: "Built for founders & small teams",
    seoTools: "no",
    outreachPlatforms: "no",
    manual: "yes",
    mentiohunt: "yes",
  },
  {
    label: "Backlink prospecting",
    seoTools: "yes",
    outreachPlatforms: "yes",
    manual: "partial",
    mentiohunt: "yes",
  },
  {
    label: "Community monitoring",
    seoTools: "no",
    outreachPlatforms: "no",
    manual: "partial",
    mentiohunt: "yes",
  },
  {
    label: "AI-drafted outreach & replies",
    seoTools: "no",
    outreachPlatforms: "partial",
    manual: "no",
    mentiohunt: "yes",
  },
  {
    label: "Daily ranked opportunity queue",
    seoTools: "no",
    outreachPlatforms: "no",
    manual: "no",
    mentiohunt: "yes",
  },
  {
    label: "Founder-friendly pricing",
    seoTools: "no",
    outreachPlatforms: "no",
    manual: "yes",
    mentiohunt: "yes",
  },
]

const gridStyle: CSSProperties = {
  gridTemplateColumns: "minmax(160px,1fr) 128px 140px 108px 128px",
}

function SupportIcon({
  support,
  highlight = false,
}: {
  support: Support
  highlight?: boolean
}) {
  if (support === "yes") {
    if (highlight) {
      return (
        <div className="mx-auto flex h-6 w-6 items-center justify-center rounded-full bg-[var(--color-blaze-orange)]/15">
          <IconCheck className="h-3.5 w-3.5 text-[var(--color-blaze-orange)]" />
        </div>
      )
    }
    return (
      <div className="mx-auto flex h-6 w-6 items-center justify-center">
        <IconCheck className="h-4 w-4 text-foreground/60" />
      </div>
    )
  }
  if (support === "partial") {
    return (
      <div className="mx-auto flex h-6 w-6 items-center justify-center">
        <IconMinus className="h-4 w-4 text-muted-foreground/55" />
      </div>
    )
  }
  return (
    <div className="mx-auto flex h-6 w-6 items-center justify-center">
      <IconX className="h-4 w-4 text-muted-foreground/35" />
    </div>
  )
}

export function Comparisons() {
  return (
    <section
      id="comparisons"
      className="relative overflow-hidden bg-background py-20 sm:py-24 lg:py-32"
      aria-labelledby="comparisons-title"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-16 left-1/2 h-[30rem] w-[30rem] -translate-x-1/2 rounded-full bg-[var(--color-princeton-orange)]/7 blur-[110px]" />
        <div className="absolute right-0 bottom-20 h-[22rem] w-[22rem] translate-x-1/3 rounded-full bg-[var(--color-amber-flame)]/8 blur-[90px]" />
      </div>

      <div className="relative container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
            Why Mentiohunt
          </span>
          <div className="mx-auto mt-3 h-px w-12 bg-[var(--color-blaze-orange)]/60" />
          <h2
            id="comparisons-title"
            className="mt-5 font-heading text-3xl font-semibold tracking-tight text-balance sm:text-4xl lg:text-[42px]"
          >
            Built for founders, not agency teams.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Most tools in this space target enterprise SEO teams or outreach
            agencies. Mentiohunt is designed for the founder running
            distribution themselves.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-x-auto">
          <div className="min-w-[580px]">
            {/* Column headers */}
            <div style={gridStyle} className="grid">
              <div />
              <div className="self-end pb-3 text-center">
                <span className="block text-xs font-semibold text-foreground/55">
                  SEO Platforms
                </span>
                <span className="mt-0.5 block text-[0.63rem] text-muted-foreground/40">
                  Ahrefs, SEMrush
                </span>
              </div>
              <div className="self-end pb-3 text-center">
                <span className="block text-xs font-semibold text-foreground/55">
                  Outreach Tools
                </span>
                <span className="mt-0.5 block text-[0.63rem] text-muted-foreground/40">
                  Pitchbox, BuzzStream
                </span>
              </div>
              <div className="self-end pb-3 text-center">
                <span className="block text-xs font-semibold text-foreground/55">
                  Manual / DIY
                </span>
              </div>
              <div className="px-2">
                <div className="rounded-t-2xl border border-b-0 border-[var(--color-blaze-orange)]/25 px-3 py-3 text-center">
                  <IconBrandMentiohunt className="mx-auto mb-1 h-5 w-5 text-[var(--color-blaze-orange)]" />
                  <span className="text-[0.7rem] font-bold text-[var(--color-blaze-orange)] uppercase">
                    Mentiohunt
                  </span>
                </div>
              </div>
            </div>

            {/* Feature rows */}
            {features.map((feature, i) => {
              const isLast = i === features.length - 1
              return (
                <div
                  key={feature.label}
                  style={gridStyle}
                  className="grid border-t border-border/50"
                >
                  <div className="py-4 pr-4 text-sm text-foreground/75">
                    {feature.label}
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <SupportIcon support={feature.seoTools} />
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <SupportIcon support={feature.outreachPlatforms} />
                  </div>
                  <div className="flex items-center justify-center py-4">
                    <SupportIcon support={feature.manual} />
                  </div>
                  <div
                    className={`mx-2 flex items-center justify-center border-x border-[var(--color-blaze-orange)]/25 py-4 ${
                      isLast
                        ? "rounded-b-2xl border-b border-[var(--color-blaze-orange)]/25"
                        : ""
                    }`}
                  >
                    <SupportIcon support={feature.mentiohunt} highlight />
                  </div>
                </div>
              )
            })}

            {/* Bottom border for last row non-Mentiohunt cells */}
            <div
              style={gridStyle}
              className="grid border-t border-border/50"
            />
          </div>
        </div>

        <div className="mx-auto mt-5 flex max-w-5xl items-center justify-end gap-5 text-[0.68rem] text-muted-foreground/40">
          <span className="flex items-center gap-1.5">
            <IconCheck className="h-3 w-3" /> Supported
          </span>
          <span className="flex items-center gap-1.5">
            <IconMinus className="h-3 w-3" /> Partial
          </span>
          <span className="flex items-center gap-1.5">
            <IconX className="h-3 w-3" /> Not supported
          </span>
        </div>
      </div>
    </section>
  )
}
