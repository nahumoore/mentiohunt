import { IconCheck, IconMinus, IconX } from "@tabler/icons-react"
import type { CSSProperties } from "react"
import { IconBrandMentiohunt } from "../custom-icons/brand-mentiohunt"

type Support = "yes" | "partial" | "no"

type FeatureRow = {
  type?: "support"
  label: string
  agencies: Support
  outreachSoftware: Support
  manual: Support
  mentiohunt: Support
}

type PricingRow = {
  type: "pricing"
  label: string
  agencies: string
  outreachSoftware: string
  manual: string
  mentiohunt: string
}

type Row = FeatureRow | PricingRow

const features: Row[] = [
  {
    label: "Prospect discovery handled for you",
    agencies: "yes",
    outreachSoftware: "no",
    manual: "no",
    mentiohunt: "yes",
  },
  {
    label: "Per-opportunity approval before outreach",
    agencies: "no",
    outreachSoftware: "no",
    manual: "yes",
    mentiohunt: "yes",
  },
  {
    label: "Fit rationale on every placement",
    agencies: "no",
    outreachSoftware: "no",
    manual: "yes",
    mentiohunt: "yes",
  },
  {
    label: "Managed end-to-end execution",
    agencies: "yes",
    outreachSoftware: "no",
    manual: "no",
    mentiohunt: "yes",
  },
  {
    label: "No campaign setup or management",
    agencies: "yes",
    outreachSoftware: "no",
    manual: "no",
    mentiohunt: "yes",
  },
  {
    type: "pricing",
    label: "Typical monthly cost",
    agencies: "$3k–$10k+",
    outreachSoftware: "$400–$1,500",
    manual: "Your time",
    mentiohunt: "$49/mo",
  },
]

const gridStyle: CSSProperties = {
  gridTemplateColumns: "minmax(160px,1fr) 128px 148px 108px 128px",
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
            More transparent than an agency. Less work than outreach software.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-muted-foreground sm:text-lg">
            Agencies are opaque. Outreach software still makes you run
            campaigns. Mentiohunt handles execution while you stay in control
            of every placement.
          </p>
        </div>

        <div className="mx-auto mt-14 max-w-5xl overflow-x-auto">
          <div className="min-w-[580px]">
            {/* Column headers */}
            <div style={gridStyle} className="grid">
              <div />
              <div className="self-end pb-3 text-center">
                <span className="block text-xs font-semibold text-foreground/55">
                  Agencies
                </span>
                <span className="mt-0.5 block text-[0.63rem] text-muted-foreground/40">
                  done-for-you services
                </span>
              </div>
              <div className="self-end pb-3 text-center">
                <span className="block text-xs font-semibold text-foreground/55">
                  Outreach Software
                </span>
                <span className="mt-0.5 block text-[0.63rem] text-muted-foreground/40">
                  Pitchbox, Respona
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
            {features.map((row, i) => {
              const isLast = i === features.length - 1
              const isPricing = row.type === "pricing"
              return (
                <div
                  key={row.label}
                  style={gridStyle}
                  className="grid border-t border-border/50"
                >
                  <div className="py-4 pr-4 text-sm text-foreground/75">
                    {row.label}
                  </div>
                  {isPricing ? (
                    <>
                      <div className="flex items-center justify-center py-4">
                        <span className="text-xs font-medium text-muted-foreground/60">
                          {(row as PricingRow).agencies}
                        </span>
                      </div>
                      <div className="flex items-center justify-center py-4">
                        <span className="text-xs font-medium text-muted-foreground/60">
                          {(row as PricingRow).outreachSoftware}
                        </span>
                      </div>
                      <div className="flex items-center justify-center py-4">
                        <span className="text-xs font-medium text-muted-foreground/60">
                          {(row as PricingRow).manual}
                        </span>
                      </div>
                      <div
                        className={`mx-2 flex items-center justify-center border-x border-[var(--color-blaze-orange)]/25 py-4 ${
                          isLast
                            ? "rounded-b-2xl border-b border-[var(--color-blaze-orange)]/25"
                            : ""
                        }`}
                      >
                        <span className="text-xs font-semibold text-[var(--color-blaze-orange)]">
                          {(row as PricingRow).mentiohunt}
                        </span>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center justify-center py-4">
                        <SupportIcon support={(row as FeatureRow).agencies} />
                      </div>
                      <div className="flex items-center justify-center py-4">
                        <SupportIcon support={(row as FeatureRow).outreachSoftware} />
                      </div>
                      <div className="flex items-center justify-center py-4">
                        <SupportIcon support={(row as FeatureRow).manual} />
                      </div>
                      <div
                        className={`mx-2 flex items-center justify-center border-x border-[var(--color-blaze-orange)]/25 py-4 ${
                          isLast
                            ? "rounded-b-2xl border-b border-[var(--color-blaze-orange)]/25"
                            : ""
                        }`}
                      >
                        <SupportIcon support={(row as FeatureRow).mentiohunt} highlight />
                      </div>
                    </>
                  )}
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

        <div className="mx-auto mt-10 flex max-w-5xl justify-center">
          <div className="inline-flex items-start gap-3 rounded-xl border border-border/40 bg-muted/30 px-5 py-4 text-left">
            <span className="mt-0.5 text-[var(--color-blaze-orange)]/60 text-base leading-none">✦</span>
            <div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Agencies and outreach platforms charge a big commission per link.
              </p>
              <p className="mt-1 text-sm font-semibold text-muted-foreground leading-relaxed">
                Mentiohunt automates the outreach end-to-end — you see real
                prices, real prospects, and every placement before it goes live.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
